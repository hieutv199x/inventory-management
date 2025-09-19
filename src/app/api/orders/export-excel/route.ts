import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Channel } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Helper function to extract quantity from channelData JSON
function getQuantityFromChannelData(channelData: string | null): number {
  if (!channelData) return 1;
  try {
    const data = JSON.parse(channelData);
    return parseInt(data.quantity) || 1;
  } catch {
    return 1;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
    const { searchParams } = new URL(req.url);

    // Check if this is an export request
    const isExport = searchParams.get('export') === 'true';
    if (!isExport) {
      return NextResponse.json({ error: "This endpoint is for export only" }, { status: 400 });
    }

    // Pagination parameters (for export, we want more data)
    const limit = parseInt(searchParams.get('limit') || '10000');
    const offset = 0; // Start from beginning for export

    // Filter parameters (same as regular orders API)
    const shopId = searchParams.get('shopId');
    const status = searchParams.get('status');
    const customStatus = searchParams.get('customStatus');
    const channelParam = searchParams.get('channel');
    const channel = channelParam && channelParam !== 'all' ? channelParam as Channel : null;
    const keyword = searchParams.get('keyword') || searchParams.get('search');
    const createTimeGe = searchParams.get('createTimeGe');
    const createTimeLt = searchParams.get('createTimeLt');

    // Build where clause (same logic as orders API)
    const where: any = {};

    // Shop access control
    if (!isAdmin && !shopId) {
      where.shopId = { in: accessibleShopIds };
    } else if (shopId) {
      where.shopId = shopId;
    }

    // Other filters
    if (status && status !== 'all') {
      where.status = status;
    }
    if (channel) {
      where.channel = channel;
    }

    if (keyword) {
      where.OR = [
        { orderId: { contains: keyword, mode: 'insensitive' } },
        { buyerEmail: { contains: keyword, mode: 'insensitive' } },
        { buyerMessage: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    // Add customStatus filter
    if (customStatus && customStatus !== 'all') {
      (where.AND ??= []);

      if (customStatus === 'NOT_SET') {
        where.AND.push({
          OR: [
            { customStatus: { isSet: false } },
            { customStatus: null },
            { customStatus: '' },
            { customStatus: { notIn: ['DELIVERED', 'SPLITTED'] } },
          ],
        });
      } else {
        const list = customStatus.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length > 1) {
          where.AND.push({ customStatus: { in: list } });
        } else {
          where.AND.push({ customStatus });
        }
      }
    }

    // Date range filter
    if (createTimeGe || createTimeLt) {
      where.createTime = {};
      
      if (createTimeGe) {
        where.createTime.gte = parseInt(createTimeGe);
      }
      
      if (createTimeLt) {
        where.createTime.lte = parseInt(createTimeLt);
      }
    }

    // Fetch orders data
    const orders = await prisma.order.findMany({
      where,
      include: {
        shop: {
          select: {
            shopName: true,
            shopId: true,
            managedName: true,
          }
        },
        lineItems: {
          select: {
            skuId: true,
            productName: true,
            skuName: true,
            sellerSku: true,
            originalPrice: true,
            salePrice: true,
            channelData: true,
          }
        },
        packages: {
          select: {
            packageId: true,
            trackingNumber: true,
            shippingProviderName: true,
            shippingProviderId: true,
            status: true,
          }
        },
        recipientAddress: {
          select: {
            fullAddress: true,
            name: true,
            phoneNumber: true,
          }
        },
        payment: {
          select: {
            totalAmount: true,
            currency: true,
          }
        },
      },
      orderBy: {
        createTime: 'desc'
      },
      take: limit,
      skip: offset,
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Orders Data (based on the template image)
    const ordersData = [];
    
    // Headers based on the template image
    const orderHeaders = [
      'Order ID',
      'SKU ID', 
      'Product name',
      'Variations',
      'Quantity',
      'Shipping provider name',
      'Tracking ID',
      'Receipt ID',
      // Additional useful fields
      'Buyer Email',
      'Status',
      'Custom Status',
      'Create Time',
      'Total Amount',
      'Currency',
      'Shop Name',
      'Recipient Name',
      'Full Address'
    ];
    
    ordersData.push(orderHeaders);

    // Process each order
    for (const order of orders) {
      if (order.lineItems && order.lineItems.length > 0) {
        // Create a row for each line item (SKU)
        for (const lineItem of order.lineItems) {
          // Find corresponding package info
          const packageInfo = order.packages?.[0]; // Get first package if exists
          
          const row = [
            order.orderId || '',
            lineItem.skuId || lineItem.sellerSku || '',
            lineItem.productName || '',
            lineItem.skuName || '', // Using skuName as variations
            getQuantityFromChannelData(lineItem.channelData) || 1, // Extract quantity from channelData
            packageInfo?.shippingProviderName || '',
            packageInfo?.trackingNumber || '',
            '', // Receipt ID - empty for now
            // Additional fields
            order.buyerEmail || '',
            order.status || '',
            order.customStatus || '',
            order.createTime ? new Date(order.createTime * 1000).toISOString() : '',
            order.payment?.totalAmount || order.totalAmount || '',
            order.payment?.currency || order.currency || '',
            order.shop?.shopName || order.shop?.managedName || '',
            order.recipientAddress?.name || '',
            order.recipientAddress?.fullAddress || '',
          ];
          ordersData.push(row);
        }
      } else {
        // Order without line items
        const packageInfo = order.packages?.[0];
        
        const row = [
          order.orderId || '',
          '', // No SKU ID
          '', // No product name
          '', // No variations
          0, // No quantity
          packageInfo?.shippingProviderName || '',
          packageInfo?.trackingNumber || '',
          '', // Receipt ID
          // Additional fields
          order.buyerEmail || '',
          order.status || '',
          order.customStatus || '',
          order.createTime ? new Date(order.createTime * 1000).toISOString() : '',
          order.payment?.totalAmount || order.totalAmount || '',
          order.payment?.currency || order.currency || '',
          order.shop?.shopName || order.shop?.managedName || '',
          order.recipientAddress?.name || '',
          order.recipientAddress?.fullAddress || '',
        ];
        ordersData.push(row);
      }
    }

    // Create orders worksheet
    const ordersWS = XLSX.utils.aoa_to_sheet(ordersData);

    // Set column widths for orders sheet
    ordersWS['!cols'] = [
      { wch: 15 }, // Order ID
      { wch: 15 }, // SKU ID
      { wch: 30 }, // Product name
      { wch: 20 }, // Variations
      { wch: 10 }, // Quantity
      { wch: 20 }, // Shipping provider name
      { wch: 20 }, // Tracking ID
      { wch: 15 }, // Receipt ID
      { wch: 25 }, // Buyer Email
      { wch: 15 }, // Status
      { wch: 15 }, // Custom Status
      { wch: 20 }, // Create Time
      { wch: 15 }, // Total Amount
      { wch: 10 }, // Currency
      { wch: 20 }, // Shop Name
      { wch: 20 }, // Recipient Name
      { wch: 40 }, // Full Address
    ];

    XLSX.utils.book_append_sheet(wb, ordersWS, 'Orders Data');

    // Sheet 2: Shipping Providers Summary
    const shippingProviders = new Map();
    
    // Collect shipping provider statistics
    for (const order of orders) {
      if (order.packages) {
        for (const pkg of order.packages) {
          if (pkg.shippingProviderName) {
            const providerName = pkg.shippingProviderName;
            if (!shippingProviders.has(providerName)) {
              shippingProviders.set(providerName, {
                name: providerName,
                id: pkg.shippingProviderId,
                count: 0,
                orders: new Set()
              });
            }
            const provider = shippingProviders.get(providerName);
            provider.count++;
            provider.orders.add(order.orderId);
          }
        }
      }
    }

    const shippingData = [];
    const shippingHeaders = [
      'Shipping Provider Name',
      'Provider ID',
      'Total Packages',
      'Unique Orders',
      'Percentage'
    ];
    shippingData.push(shippingHeaders);

    const totalPackages = Array.from(shippingProviders.values()).reduce((sum, p) => sum + p.count, 0);
    
    for (const provider of shippingProviders.values()) {
      const percentage = totalPackages > 0 ? ((provider.count / totalPackages) * 100).toFixed(2) + '%' : '0%';
      shippingData.push([
        provider.name,
        provider.id || '',
        provider.count,
        provider.orders.size,
        percentage
      ]);
    }

    // Create shipping providers worksheet
    const shippingWS = XLSX.utils.aoa_to_sheet(shippingData);
    
    // Set column widths for shipping sheet
    shippingWS['!cols'] = [
      { wch: 25 }, // Shipping Provider Name
      { wch: 15 }, // Provider ID
      { wch: 15 }, // Total Packages
      { wch: 15 }, // Unique Orders
      { wch: 12 }, // Percentage
    ];

    XLSX.utils.book_append_sheet(wb, shippingWS, 'Shipping Providers');

    // Generate Excel buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Create response with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="orders_export_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("Export Excel API error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}