import { AmazonSPAPIClient } from '../client';

interface Money {
  CurrencyCode: string;
  Amount: string;
}

interface PaymentExecutionDetailItem {
  Payment: Money;
  PaymentMethod: string;
}

interface ShippingAddress {
  Name: string;
  AddressLine1?: string;
  AddressLine2?: string;
  AddressLine3?: string;
  City?: string;
  County?: string;
  District?: string;
  StateOrRegion?: string;
  Municipality?: string;
  PostalCode?: string;
  CountryCode?: string;
  Phone?: string;
  AddressType?: string;
}

interface Order {
  AmazonOrderId: string;
  SellerOrderId?: string;
  PurchaseDate: string;
  LastUpdateDate: string;
  OrderStatus: 'Pending' | 'Unshipped' | 'PartiallyShipped' | 'Shipped' | 'Canceled' | 'Unfulfillable' | 'InvoiceUnconfirmed' | 'PendingAvailability';
  FulfillmentChannel?: 'MFN' | 'AFN';
  SalesChannel?: string;
  OrderChannel?: string;
  ShipServiceLevel?: string;
  OrderTotal?: Money;
  NumberOfItemsShipped?: number;
  NumberOfItemsUnshipped?: number;
  PaymentExecutionDetail?: PaymentExecutionDetailItem[];
  PaymentMethod?: 'COD' | 'CVS' | 'Other';
  PaymentMethodDetails?: string[];
  MarketplaceId?: string;
  ShipmentServiceLevelCategory?: string;
  EasyShipShipmentStatus?: string;
  CbaDisplayableShippingLabel?: string;
  OrderType?: 'StandardOrder' | 'LongLeadTimeOrder' | 'Preorder' | 'BackOrder' | 'SourcingOnDemandOrder';
  EarliestShipDate?: string;
  LatestShipDate?: string;
  EarliestDeliveryDate?: string;
  LatestDeliveryDate?: string;
  IsBusinessOrder?: boolean;
  IsPrime?: boolean;
  IsPremiumOrder?: boolean;
  IsGlobalExpressEnabled?: boolean;
  ReplacedOrderId?: string;
  IsReplacementOrder?: boolean;
  PromiseResponseDueDate?: string;
  IsEstimatedShipDateSet?: boolean;
  IsSoldByAB?: boolean;
  IsIBA?: boolean;
  DefaultShipFromLocationAddress?: ShippingAddress;
  BuyerInvoicePreference?: 'INDIVIDUAL' | 'BUSINESS';
  BuyerTaxInformation?: {
    BuyerLegalCompanyName?: string;
    BuyerBusinessAddress?: string;
    BuyerTaxRegistrationId?: string;
    BuyerTaxOffice?: string;
  };
  FulfillmentInstruction?: {
    FulfillmentSupplySourceId?: string;
  };
  IsISPU?: boolean;
  IsAccessPointOrder?: boolean;
  MarketplaceTaxInfo?: {
    TaxClassifications?: Array<{
      Name?: string;
      Value?: string;
    }>;
  };
  SellerDisplayName?: string;
  ShippingAddress?: ShippingAddress;
  BuyerInfo?: {
    BuyerEmail?: string;
    BuyerName?: string;
    BuyerCounty?: string;
    BuyerTaxInfo?: {
      CompanyLegalName?: string;
      TaxingRegion?: string;
      TaxClassifications?: Array<{
        Name?: string;
        Value?: string;
      }>;
    };
    PurchaseOrderNumber?: string;
  };
  AutomatedShippingSettings?: {
    HasAutomatedShippingSettings?: boolean;
    AutomatedCarrier?: string;
    AutomatedShipMethod?: string;
  };
  HasRegulatedItems?: boolean;
  ElectronicInvoiceStatus?: 'NotRequired' | 'NotFound' | 'Processing' | 'Errored' | 'Accepted';
}

interface GetOrdersResponse {
  payload: {
    Orders: Order[];
    NextToken?: string;
    LastUpdatedBefore?: string;
    CreatedBefore?: string;
  };
  errors?: Array<{
    code: string;
    message: string;
    details?: string;
  }>;
}

export class OrdersService extends AmazonSPAPIClient {
  async getOrders(
    marketplaceIds: string[],
    createdAfter?: string,
    createdBefore?: string,
    lastUpdatedAfter?: string,
    lastUpdatedBefore?: string,
    orderStatuses?: Array<'Pending' | 'Unshipped' | 'PartiallyShipped' | 'Shipped' | 'Canceled' | 'Unfulfillable' | 'InvoiceUnconfirmed' | 'PendingAvailability'>,
    fulfillmentChannels?: Array<'MFN' | 'AFN'>,
    paymentMethods?: Array<'COD' | 'CVS' | 'Other'>,
    buyerEmail?: string,
    sellerOrderId?: string,
    maxResultsPerPage?: number,
    easyShipShipmentStatuses?: string[],
    electronicInvoiceStatuses?: Array<'NotRequired' | 'NotFound' | 'Processing' | 'Errored' | 'Accepted'>,
    nextToken?: string,
    amazonOrderIds?: string[]
  ): Promise<GetOrdersResponse> {
    const queryParams: Record<string, string> = {};

    // MarketplaceIds is required
    if (marketplaceIds && marketplaceIds.length > 0) {
      queryParams.MarketplaceIds = marketplaceIds.join(',');
    }

    // Ensure at least one time filter is provided (required by Amazon SP-API)
    if (!amazonOrderIds || amazonOrderIds.length === 0) {
      if (!createdAfter && !lastUpdatedAfter && !createdBefore && !lastUpdatedBefore) {
        // Default to orders created in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        createdAfter = sevenDaysAgo.toISOString();
        console.log('No date filter provided, using default createdAfter:', createdAfter);
      }
    }

    if (createdAfter) queryParams.CreatedAfter = createdAfter;
    if (createdBefore) queryParams.CreatedBefore = createdBefore;
    if (lastUpdatedAfter) queryParams.LastUpdatedAfter = lastUpdatedAfter;
    if (lastUpdatedBefore) queryParams.LastUpdatedBefore = lastUpdatedBefore;
    if (orderStatuses && orderStatuses.length > 0) queryParams.OrderStatuses = orderStatuses.join(',');
    if (fulfillmentChannels && fulfillmentChannels.length > 0) queryParams.FulfillmentChannels = fulfillmentChannels.join(',');
    if (paymentMethods && paymentMethods.length > 0) queryParams.PaymentMethods = paymentMethods.join(',');
    if (buyerEmail) queryParams.BuyerEmail = buyerEmail;
    if (sellerOrderId) queryParams.SellerOrderId = sellerOrderId;
    if (maxResultsPerPage && maxResultsPerPage >= 1 && maxResultsPerPage <= 100) {
      queryParams.MaxResultsPerPage = maxResultsPerPage.toString();
    }
    if (easyShipShipmentStatuses && easyShipShipmentStatuses.length > 0) {
      queryParams.EasyShipShipmentStatuses = easyShipShipmentStatuses.join(',');
    }
    if (electronicInvoiceStatuses && electronicInvoiceStatuses.length > 0) {
      queryParams.ElectronicInvoiceStatuses = electronicInvoiceStatuses.join(',');
    }
    if (nextToken) queryParams.NextToken = nextToken;
    if (amazonOrderIds && amazonOrderIds.length > 0) {
      queryParams.AmazonOrderIds = amazonOrderIds.join(',');
    }

    console.log('Final query params for orders API:', queryParams);

    return this.request<GetOrdersResponse>({
      method: 'GET',
      path: '/orders/v0/orders',
      queryParams,
    });
  }

  async getOrder(orderId: string): Promise<{ payload: Order }> {
    return this.request<{ payload: Order }>({
      method: 'GET',
      path: `/orders/v0/orders/${orderId}`,
    });
  }
}
