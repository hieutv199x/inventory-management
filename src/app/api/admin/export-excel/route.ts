import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { filters } = await request.json();

    // Build the where clause based on filters
    const whereClause: any = {};

    if (filters?.searchTerm) {
      whereClause.OR = [
        { packageId: { contains: filters.searchTerm } },
        { trackingNumber: { contains: filters.searchTerm } },
        { shippingProviderName: { contains: filters.searchTerm } },
        { order: { 
          OR: [
            { buyerEmail: { contains: filters.searchTerm } },
            { recipientAddress: { name: { contains: filters.searchTerm } } }
          ]
        }}
      ];
    }

    if (filters?.status && filters.status !== 'all') {
      whereClause.status = filters.status;
    }

    if (filters?.channel && filters.channel !== 'all') {
      whereClause.order = {
        ...whereClause.order,
        channel: filters.channel
      };
    }

    // Fetch OrderPackage data with related order information
    const orderPackages = await prisma.orderPackage.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            orderId: true,
            buyerEmail: true,
            channel: true,
            totalAmount: true,
            currency: true,
            status: true,
            createdAt: true,
            recipientAddress: {
              select: {
                name: true,
                phoneNumber: true,
                fullAddress: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get unique shipping providers for the separate sheet - lấy TẤT CẢ providers không theo filter
    const shippingProviders = await prisma.orderPackage.findMany({
      where: {
        shippingProviderId: { not: null },
        shippingProviderName: { not: null }
      },
      select: {
        shippingProviderId: true,
        shippingProviderName: true
      },
      distinct: ['shippingProviderId']
    });

    console.log('Total shipping providers found:', shippingProviders.length);

    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();

    // Main orders data sheet - chỉ các trường theo template với thông tin từ ordersData
    const ordersData = orderPackages.map((pkg, index) => {
      // Parse ordersData để lấy thông tin SKU và quantity
      let orderId = '';
      let skuInfo = '';
      let quantity = '';
      
      try {
        if (pkg.ordersData) {
          const parsedOrdersData = JSON.parse(pkg.ordersData);
          if (Array.isArray(parsedOrdersData) && parsedOrdersData.length > 0) {
            const firstOrder = parsedOrdersData[0];
            orderId = firstOrder.id || ''; // Order ID từ ordersData
            if (firstOrder.skus && Array.isArray(firstOrder.skus) && firstOrder.skus.length > 0) {
              const firstSku = firstOrder.skus[0];
              skuInfo = firstSku.id || '';
              quantity = firstSku.quantity || '';
            }
          }
        }
      } catch (error) {
        console.log('Error parsing ordersData:', error);
      }

      return {
        'Package ID': pkg.packageId, // packageId là Package ID
        'Order ID': orderId, // ID từ ordersData
        'SKU ID': skuInfo, // Từ ordersData
        'Quantity': quantity, // Từ ordersData
        'Shipping provider name': pkg.shippingProviderName || '', // Required
        'Tracking ID': pkg.trackingNumber || '' // Required
      };
    });

    // Shipping providers data sheet
    const providersData = shippingProviders.map((provider, index) => ({
      'No': index + 1,
      'Provider ID': provider.shippingProviderId,
      'Provider Name': provider.shippingProviderName
    }));

    // Create worksheets
    const ordersWorksheet = XLSX.utils.json_to_sheet(ordersData);
    const providersWorksheet = XLSX.utils.json_to_sheet(providersData);

    // Set column widths for better formatting - theo template
    const ordersColWidths = [
      { wch: 20 }, // Package ID
      { wch: 20 }, // Order ID
      { wch: 20 }, // SKU ID
      { wch: 20 }, // Quantity
      { wch: 20 }, // Shipping provider name
      { wch: 20 }  // Tracking ID
    ];

    const providersColWidths = [
      { wch: 5 },  // No
      { wch: 20 }, // Provider ID
      { wch: 25 }  // Provider Name
    ];

    ordersWorksheet['!cols'] = ordersColWidths;
    providersWorksheet['!cols'] = providersColWidths;

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(workbook, ordersWorksheet, 'Shipping Info');
    XLSX.utils.book_append_sheet(workbook, providersWorksheet, 'Shipping Providers');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `order-packages-export-${timestamp}.xlsx`;

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Export Excel error:', error);
    return NextResponse.json(
      { error: 'Failed to export data to Excel' },
      { status: 500 }
    );
  }
}