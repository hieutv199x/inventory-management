import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

interface ImportRow {
  'Order ID': string;
  'SKU ID'?: string;
  'Product name'?: string;
  'Variations'?: string;
  'Quantity'?: number;
  'Shipping provider name': string;
  'Tracking ID': string;
  'Receipt ID'?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
    
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
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportRow[];

    if (jsonData.length === 0) {
      return NextResponse.json({ success: false, error: "Excel file is empty or has no data rows" }, { status: 400 });
    }

    console.log(`Processing ${jsonData.length} rows from Excel file`);

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowIndex = i + 2; // Excel row number (accounting for header)

      try {
        // Validate required fields
        if (!row['Order ID']) {
          errors.push(`Row ${rowIndex}: Order ID is required`);
          errorCount++;
          continue;
        }

        if (!row['Shipping provider name']) {
          errors.push(`Row ${rowIndex}: Shipping provider name is required`);
          errorCount++;
          continue;
        }

        if (!row['Tracking ID']) {
          errors.push(`Row ${rowIndex}: Tracking ID is required`);
          errorCount++;
          continue;
        }

        const orderId = row['Order ID'].toString().trim();
        const shippingProviderName = row['Shipping provider name'].toString().trim();
        const trackingNumber = row['Tracking ID'].toString().trim();

        // Find the order in database
        const order = await prisma.order.findFirst({
          where: {
            orderId: orderId,
            ...(isAdmin ? {} : { shopId: { in: accessibleShopIds } })
          }
        });

        if (!order) {
          errors.push(`Row ${rowIndex}: Order ${orderId} not found or access denied`);
          errorCount++;
          continue;
        }

        // Create or update order package
        const packageData: any = {
          packageId: `${orderId}_${Date.now()}`, // Generate unique package ID
          trackingNumber: trackingNumber,
          shippingProviderName: shippingProviderName,
          shippingProviderId: null, // Will be set if we have mapping
          status: 'IN_TRANSIT',
          createTime: Math.floor(Date.now() / 1000),
          updateTime: Math.floor(Date.now() / 1000),
          orderId: order.id,
        };

        // Optional fields
        if (row['SKU ID']) {
          packageData.orderLineItemIds = [row['SKU ID'].toString()];
        }

        if (row['Receipt ID']) {
          packageData.channelData = JSON.stringify({
            receiptId: row['Receipt ID'].toString(),
            productName: row['Product name']?.toString(),
            variations: row['Variations']?.toString(),
            quantity: row['Quantity'] || 1,
            importedAt: new Date().toISOString(),
          });
        }

        // Check if package with same tracking number already exists for this order
        const existingPackage = await prisma.orderPackage.findFirst({
          where: {
            orderId: order.id,
            trackingNumber: trackingNumber,
          }
        });

        if (existingPackage) {
          // Update existing package
          await prisma.orderPackage.update({
            where: { id: existingPackage.id },
            data: {
              shippingProviderName: packageData.shippingProviderName,
              updateTime: packageData.updateTime,
              channelData: packageData.channelData,
            }
          });
          console.log(`Updated existing package for order ${orderId}, tracking: ${trackingNumber}`);
        } else {
          // Create new package
          await prisma.orderPackage.create({
            data: packageData
          });
          console.log(`Created new package for order ${orderId}, tracking: ${trackingNumber}`);
        }

        processedCount++;

      } catch (error: any) {
        console.error(`Error processing row ${rowIndex}:`, error);
        errors.push(`Row ${rowIndex}: ${error.message}`);
        errorCount++;
      }
    }

    const result = {
      success: true,
      data: {
        totalRows: jsonData.length,
        processed: processedCount,
        errors: errorCount,
        errorDetails: errors.slice(0, 10), // Limit to first 10 errors for response
      }
    };

    console.log(`Import completed: ${processedCount} successful, ${errorCount} errors`);

    return NextResponse.json(result);

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