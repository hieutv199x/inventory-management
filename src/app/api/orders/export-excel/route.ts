import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { requireOrg, resolveOrgContext } from '@/lib/tenant-context';

export async function POST(request: NextRequest) {
  try {
    const { filters, selectedOrderIds } = await request.json();

    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

    // Build filters for orders table
    const whereOrder: any = {
      orgId: org.id,
    };

    // If specific order IDs are selected, use them
    if (selectedOrderIds && Array.isArray(selectedOrderIds) && selectedOrderIds.length > 0) {
      whereOrder.id = { in: selectedOrderIds };
    } else {
      // Otherwise, use filters (fallback for backward compatibility)

      // Optional shop filter
      if (filters?.shopId) {
        whereOrder.shopId = filters.shopId;
      }

      // Optional status filter
      if (filters?.status && filters.status !== 'all') {
        whereOrder.status = filters.status;
      }

      // Optional date range (uses createTime like other APIs)
      if (filters?.dateFrom || filters?.dateTo) {
        whereOrder.createTime = {};
        if (filters.dateFrom) {
          whereOrder.createTime.gte = Math.floor(new Date(filters.dateFrom).getTime() / 1000);
        }
        if (filters.dateTo) {
          whereOrder.createTime.lt = Math.floor(new Date(filters.dateTo).getTime() / 1000);
        }
      }

      // Optional text search on orderId/buyerEmail
      if (filters?.searchTerm) {
        whereOrder.OR = [
          { orderId: { contains: filters.searchTerm, mode: 'insensitive' } },
          { buyerEmail: { contains: filters.searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    // Fetch orders with only packages relation
    const orders = await prisma.order.findMany({
      where: whereOrder,
      select: {
        orderId: true,
        shopId: true,
        createTime: true,
        status: true,
        lineItems: true,
        packages: {
          select: {
            packageId: true,
            trackingNumber: true,
            shippingProviderId: true,
            shippingProviderName: true,
            orderLineItemIds: true,
          }
        }
      },
      orderBy: { createTime: 'desc' }
    });

    // Helpers to compute matched line items and aggregates
    const parseCD = (v: any) => {
      try { return typeof v === 'string' ? JSON.parse(v || '{}') : (v || {}); } catch { return {}; }
    };
    const getQty = (li: any) => {
      if (typeof li?.quantity === 'number') return li.quantity;
      const cd = parseCD(li?.channelData);
      return Number(cd?.quantity) || 1;
    };

    // Flatten packages for main worksheet with additional columns
    const packageRows = orders.flatMap(o => {
      const items = Array.isArray(o.lineItems) ? o.lineItems : [];
      return (o.packages || []).map(pkg => {
        const ids: string[] = Array.isArray(pkg.orderLineItemIds) ? pkg.orderLineItemIds : [];
        const matched = items.filter((li: any) => {
          const k1 = li?.id;
          const k2 = li?.lineItemId;
          return (k1 && ids.includes(k1)) || (k2 && ids.includes(k2));
        });

        const skuIds = matched.map((li: any) => li?.skuId || li?.sellerSku || li?.id || '').filter(Boolean).join('\n');
        const productNames = matched.map((li: any) => li?.productName || '').filter(Boolean).join('\n');
        const variations = matched.map((li: any) => li?.skuName || '').filter(Boolean).join('\n');
        const quantities = matched.map((li: any) => String(getQty(li))).join('\n');

        return {
          'Order ID': o.orderId,
          'Package ID': pkg.packageId || '',
          'Provider ID': pkg.shippingProviderId || '',
          'Provider Name': pkg.shippingProviderName || '',
          'Tracking ID': pkg.trackingNumber || '',
          'SKU ID': skuIds,
          'Product name': productNames,
          'Variations': variations,
          'Quantity': quantities,
        };
      });
    });

    // Helper: fetch providers from internal API for a representative order per shop
    const baseApi = new URL('/api/tiktok/Fulfillment/shipping-provider', request.url).toString();

    // Pick one representative orderId per shopId to reduce API calls
    const shopToOrderId = new Map<string, string>();
    for (const o of orders) {
      if (o.shopId && !shopToOrderId.has(o.shopId)) {
        shopToOrderId.set(o.shopId, o.orderId);
      }
    }

    const providerLists = await Promise.all(
      Array.from(shopToOrderId.values()).map(async (orderId) => {
        try {
          const res = await fetch(`${baseApi}?orderId=${encodeURIComponent(orderId)}`, {
            method: 'GET',
            headers: { 'content-type': 'application/json' },
          });
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      })
    );

    // Deduplicate providers across shops
    const providerSeen = new Set<string>();
    const providers: { id: string; name: string }[] = [];

    for (const list of providerLists) {
      for (const p of list) {
        const id = typeof p === 'string' ? p : (p.id || p.name || p.displayName || '');
        const name = typeof p === 'string' ? p : (p.displayName || p.name || p.id || '');
        if (!id && !name) continue;

        const key = `${id}::${name}`;
        if (providerSeen.has(key)) continue;
        providerSeen.add(key);
        providers.push({ id, name });
      }
    }

    const providersData = providers.map((p, idx) => ({ no: idx + 1, id: p.id, name: p.name }));
    // Create workbook and worksheets with exceljs
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.resolve(process.cwd(), 'public/templates/template-order-package.xlsx');
    await workbook.xlsx.readFile(templatePath);

    // Main sheet: Order Packages (add new columns)
    const pkgSheet = workbook.getWorksheet('Order Packages');

    if (!pkgSheet) {
      throw new Error('Template is missing "Order Packages" sheet');
    }

    // Add package rows
    let i = 1;
    const formulaeProvider = providersData?.map(p => p.name).join(',');
    for (const row of packageRows) {
      pkgSheet.getCell(`A${i + 1}`).value = row['Order ID'];
      pkgSheet.getCell(`B${i + 1}`).value = row['Package ID'];
      pkgSheet.getCell(`D${i + 1}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${formulaeProvider}"`],
        showErrorMessage: true,
        error: 'Please select a value from the list.'
      };
      pkgSheet.getCell(`F${i + 1}`).value = row['SKU ID'];
      pkgSheet.getCell(`G${i + 1}`).value = row['Product name'];
      pkgSheet.getCell(`H${i + 1}`).value = row['Variations'];
      pkgSheet.getCell(`I${i + 1}`).value = row['Quantity'];
      i++;
    }
    pkgSheet.getColumn("F").hidden = true;
    pkgSheet.getColumn("G").hidden = true;
    pkgSheet.getColumn("H").hidden = true;
    pkgSheet.getColumn("I").hidden = true;

    // Providers sheet
    const provSheet = workbook.getWorksheet('Shipping Providers');

    if (!provSheet) {
      throw new Error('Template is missing "Shipping Providers" sheet');
    }

    i = 1;
    for (const p of providersData) {
      provSheet.getCell(`A${i + 1}`).value = p.no;
      provSheet.getCell(`B${i + 1}`).value = p.id;
      provSheet.getCell(`C${i + 1}`).value = p.name;
      i++;
    }

    const pkgCount = packageRows.length;
    const provCount = providers.length;
    if (pkgCount > 0 && provCount > 0) {
      const pkgStartRow = 2; // header is row 1
      const pkgEndRow = pkgStartRow + pkgCount - 1;
      const provStartRow = 2;
      const provEndRow = provStartRow + provCount - 1;

      // Named range for Provider Names (column C in providers sheet)
      workbook.definedNames.add(
        'Providers',
        `'Shipping Providers'!$C$${provStartRow}:$C$${provEndRow}`
      );

      // Auto-map Provider ID in column C using INDEX/MATCH against providers sheet
      for (let r = pkgStartRow; r <= pkgEndRow; r++) {
        const formula = `IFERROR(INDEX('Shipping Providers'!$B$${provStartRow}:$B$${provEndRow}, MATCH(D${r}, 'Shipping Providers'!$C$${provStartRow}:$C$${provEndRow}, 0)), "")`;
        const cell = pkgSheet.getCell(`C${r}`);
        cell.value = { formula };
      }
    }

    // Generate and return Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `order-packages-export-${timestamp}.xlsx`;

    return new NextResponse(excelBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String((excelBuffer as ArrayBuffer).byteLength ?? (excelBuffer as any).length),
      },
    });
  } catch (error) {
    console.error('Export Excel error:', error);
    return NextResponse.json(
      { error: 'Failed to export data to Excel' },
      { status: 500 }
    );
  }
}