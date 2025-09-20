import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import * as XLSX from 'xlsx';
import { addTracking as addTrackingBulk } from '@/app/api/orders/bulk-tracking/route';

const prisma = new PrismaClient();

type PackageRow = {
  'Order ID'?: string | number;
  'Package ID'?: string | number;
  'Provider ID'?: string | number;
  'Provider Name'?: string;
  'Tracking ID'?: string | number;
  // ...other columns are ignored
};

type ProviderRow = {
  'Provider ID'?: string | number;
  'Provider Name'?: string;
  // ...other columns are ignored
};

export async function POST(req: NextRequest) {
  try {
    // Auth (kept)
    await getUserWithShopAccess(req, prisma);

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ success: false, error: "Invalid file format. Please upload Excel file (.xlsx or .xls)" }, { status: 400 });
    }

    // Read Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Resolve sheets by name with fallbacks
    const packagesSheet =
      workbook.Sheets['Order Packages'] ??
      workbook.Sheets[workbook.SheetNames[0]];
    const providersSheet =
      workbook.Sheets['Shipping Providers'] ??
      workbook.Sheets[
        workbook.SheetNames.find(n => n.toLowerCase().includes('provider')) || ''
      ];

    if (!packagesSheet) {
      return NextResponse.json({ success: false, error: 'Sheet "Order Packages" not found' }, { status: 400 });
    }

    // Parse sheets
    const pkgRows = XLSX.utils.sheet_to_json<PackageRow>(packagesSheet, { defval: '' });
    const provRows = providersSheet ? XLSX.utils.sheet_to_json<ProviderRow>(providersSheet, { defval: '' }) : [];

    // Build provider name -> id map (case-insensitive)
    const providerMap = new Map<string, string>();
    for (const pr of provRows) {
      const id = String(pr['Provider ID'] ?? '').trim();
      const name = String(pr['Provider Name'] ?? '').trim();
      if (!name) continue;
      providerMap.set(name.toLowerCase(), id);
    }

    const mapped: { orderId: string; packageId: string; providerId: string; trackingNumber: string }[] = [];
    const errors: string[] = [];

    // Map rows
    pkgRows.forEach((row, i) => {
      const rowIndex = i + 2; // account for header row
      const orderId = String(row['Order ID'] ?? '').trim();
      const packageId = String(row['Package ID'] ?? '').trim();
      const trackingNumber = String(row['Tracking ID'] ?? '').trim();

      let providerId = String(row['Provider ID'] ?? '').trim();
      const providerName = String(row['Provider Name'] ?? '').trim();

      if (!providerId && providerName) {
        const looked = providerMap.get(providerName.toLowerCase());
        if (looked) providerId = looked;
      }

      // Minimal validation
      if (!orderId) {
        errors.push(`Row ${rowIndex}: Missing Order ID`);
        return;
      }
      if (!trackingNumber) {
        errors.push(`Row ${rowIndex}: Missing Tracking ID`);
        return;
      }
      if (!providerId) {
        errors.push(`Row ${rowIndex}: Missing Provider ID and could not resolve from Provider Name "${providerName}"`);
        return;
      }

      mapped.push({ orderId, packageId, providerId, trackingNumber });
    });

    // If we have mapped rows, enrich and push via addTracking (no HTTP call)
    let bulk: { summary?: any; errors?: any[]; results?: any[] } | undefined;
    if (mapped.length > 0) {
      // Get TikTok shopId (shop.shopId) per orderId
      const orderIds = Array.from(new Set(mapped.map(r => r.orderId)));
      const dbOrders = await prisma.order.findMany({
        where: { orderId: { in: orderIds } },
        select: { orderId: true, shop: { select: { shopId: true } } },
      });
      const orderShopMap = new Map(dbOrders.map(o => [o.orderId, o.shop?.shopId || '']));

      // Prepare rows to send to addTracking
      const rows = mapped.map(r => ({
        orderId: r.orderId,
        shopId: orderShopMap.get(r.orderId) || '',
        packageId: r.packageId,
        providerId: r.providerId,
        trackingId: r.trackingNumber,
      }));

      // Group by shopId and collect input errors for missing shopId
      const groups = new Map<string, typeof rows>();
      const inputErrors: any[] = [];
      for (const r of rows) {
        const sid = String(r.shopId || '').trim();
        if (!sid) {
          inputErrors.push({
            code: 'MISSING_SHOP_ID',
            message: 'shopId is required',
            packageId: r.packageId || null,
            orderId: r.orderId || null,
          });
          continue;
        }
        if (!groups.has(sid)) groups.set(sid, []);
        groups.get(sid)!.push(r);
      }

      // Call addTracking per shopId in parallel
      const groupResults = await Promise.all(
        Array.from(groups.entries()).map(async ([sid, groupRows]) => {
          const res = await addTrackingBulk(groupRows as any, sid);
          return { ...res };
        })
      );

      // Normalize errors and build summary
      const apiErrors = groupResults.flatMap((gr: any) =>
        (gr.errors || []).map((e: any) => ({
          shopId: gr.shopId,
          packageId: e?.detail?.packageId ?? e?.packageId ?? null,
          code: e?.code ?? 'UNKNOWN',
          message: e?.message ?? 'Unknown error',
        }))
      );

      const submitted = Array.from(groups.values()).reduce((sum, arr) => sum + arr.length, 0);
      const failed = apiErrors.length + inputErrors.length;
      const succeeded = Math.max(submitted - failed, 0);

      bulk = {
        summary: {
          groups: groups.size,
          submitted,
          succeeded,
          failed,
        },
        errors: [...inputErrors, ...apiErrors],
        results: groupResults,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRows: pkgRows.length,
        mapped: mapped.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 20),
        rows: mapped,
        bulk,
      }
    });
  } catch (error: any) {
    console.error("Import Excel API error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}