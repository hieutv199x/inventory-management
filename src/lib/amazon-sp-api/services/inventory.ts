import { AmazonSPAPIClient } from '../client';

interface InventorySummary {
  asin: string;
  fnSku: string;
  sellerSku: string;
  condition: string;
  inventoryDetails: {
    fulfillableQuantity: number;
    inboundWorkingQuantity: number;
    inboundShippedQuantity: number;
    inboundReceivingQuantity: number;
    reservedQuantity: {
      totalReservedQuantity: number;
      pendingCustomerOrderQuantity: number;
      pendingTransshipmentQuantity: number;
      fcProcessingQuantity: number;
    };
    researchingQuantity: {
      totalResearchingQuantity: number;
      researchingQuantityBreakdown: Array<{
        name: string;
        quantity: number;
      }>;
    };
    unfulfillableQuantity: {
      totalUnfulfillableQuantity: number;
      customerDamagedQuantity: number;
      warehouseDamagedQuantity: number;
      distributorDamagedQuantity: number;
      carrierDamagedQuantity: number;
      defectiveQuantity: number;
      expiredQuantity: number;
    };
  };
  lastUpdatedTime: string;
  productName: string;
  totalQuantity: number;
}

interface GetInventorySummariesResponse {
  payload: {
    granularity: {
      granularityType: string;
      granularityId: string;
    };
    inventorySummaries: InventorySummary[];
  };
  pagination?: {
    nextToken?: string;
  };
}

export class InventoryService extends AmazonSPAPIClient {
  async getInventorySummaries(
    granularityType: 'Marketplace',
    granularityId: string,
    marketplaceIds: string[],
    details?: boolean,
    startDateTime?: string,
    sellerSkus?: string[],
    nextToken?: string,
    maxResultsPerPage?: number
  ): Promise<GetInventorySummariesResponse> {
    const queryParams: Record<string, string> = {
      granularityType,
      granularityId,
      marketplaceIds: marketplaceIds.join(','),
    };

    if (details !== undefined) queryParams.details = details.toString();
    if (startDateTime) queryParams.startDateTime = startDateTime;
    if (sellerSkus) queryParams.sellerSkus = sellerSkus.join(',');
    if (nextToken) queryParams.nextToken = nextToken;
    if (maxResultsPerPage) queryParams.maxResultsPerPage = maxResultsPerPage.toString();

    return this.request<GetInventorySummariesResponse>({
      method: 'GET',
      path: '/fba/inventory/v1/summaries',
      queryParams,
    });
  }
}
