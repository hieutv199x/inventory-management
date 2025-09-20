import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { filters } = await request.json();

    // Build filters for orders table
    const whereOrder: any = {};

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

    // Create workbook and worksheets with exceljs
    const workbook = new ExcelJS.Workbook();

    // Main sheet: Order Packages (add new columns)
    const pkgSheet = workbook.addWorksheet('Order Packages');
    pkgSheet.columns = [
      { header: 'Order ID', width: 22 },        // A
      { header: 'Package ID', width: 24 },      // B
      { header: 'Provider ID', width: 22 },     // C
      { header: 'Provider Name', width: 28 },   // D
      { header: 'Tracking ID', width: 24 },     // E
      { header: 'SKU ID', width: 28 },          // F
      { header: 'Product name', width: 40 },    // G
      { header: 'Variations', width: 28 },      // H
      { header: 'Quantity', width: 12 },        // I
    ];
    // Add package rows
    for (const row of packageRows) {
      pkgSheet.addRow([
        row['Order ID'],
        row['Package ID'],
        row['Provider ID'],
        row['Provider Name'],
        row['Tracking ID'],
        row['SKU ID'],
        row['Product name'],
        row['Variations'],
        row['Quantity'],
      ]);
    }

    // Wrap text for multi-line cells in SKU/Name/Variations/Quantity columns
    const wrapCols = ['F', 'G', 'H', 'I'];
    for (let r = 2; r <= (packageRows.length + 1); r++) {
      for (const col of wrapCols) {
        const cell = pkgSheet.getCell(`${col}${r}`);
        cell.alignment = { wrapText: true, vertical: 'top' };
      }
    }

    // Providers sheet
    const provSheet = workbook.addWorksheet('Shipping Providers');
    provSheet.columns = [
      { header: 'No', width: 6 },
      { header: 'Provider ID', width: 24 },
      { header: 'Provider Name', width: 32 },
    ];
    const providersData = providers.map((p, idx) => ({ no: idx + 1, id: p.id, name: p.name }));
    for (const p of providersData) {
      provSheet.addRow([p.no, p.id, p.name]);
    }

    // Data validation + formula mapping
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

      // NOTE: ExcelJS does not support adding data validation (dropdowns) directly.
      // You can only set cell values and formulas. Data validation must be added manually in Excel.
      // If you need to inform users, consider adding a note or instruction in the sheet.
      pkgSheet.getCell('D1').note = 'Vui lòng chọn tên hãng vận chuyển từ danh sách ở sheet "Shipping Providers".';
      pkgSheet.getCell('C1').note = 'Cột này sẽ tự điền theo cột "Provider Name".';

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