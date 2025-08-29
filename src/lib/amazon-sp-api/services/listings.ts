import { AmazonSPAPIClient } from '../client';

interface Issue {
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  attributeNames?: string[];
  categories?: string[];
  enforcements?: {
    actions: Array<{
      action: string;
    }>;
    exemption: {
      status: 'EXEMPT' | 'EXEMPT_UNTIL_EXPIRY_DATE' | 'NOT_EXEMPT';
      expiryDate?: string;
    };
  };
}

interface PatchOperation {
  op: 'add' | 'replace' | 'merge' | 'delete';
  path: string;
  value?: any;
}

interface ListingsItemPutRequest {
  productType: string;
  requirements?: 'LISTING' | 'LISTING_PRODUCT_ONLY' | 'LISTING_OFFER_ONLY';
  attributes: Record<string, any>;
}

interface ListingsItemPatchRequest {
  productType: string;
  patches: PatchOperation[];
}

interface ListingsItemSubmissionResponse {
  sku: string;
  status: 'ACCEPTED' | 'INVALID' | 'VALID';
  submissionId: string;
  issues?: Issue[];
  identifiers?: Array<{
    marketplaceId: string;
    asin?: string;
  }>;
}

interface ItemSummary {
  marketplaceId: string;
  asin?: string;
  productType?: string;
  conditionType?: string;
  status: string[];
  fnSku?: string;
  itemName?: string;
  createdDate?: string;
  lastUpdatedDate?: string;
  mainImage?: {
    link: string;
    height?: number;
    width?: number;
  };
}

interface ItemOffer {
  marketplaceId: string;
  offerType: 'B2C' | 'B2B';
  price: {
    currencyCode: string;
    amount: string;
  };
  points?: {
    pointsNumber: number;
  };
  audience?: {
    value: string;
    displayName?: string;
  };
}

interface FulfillmentAvailability {
  fulfillmentChannelCode: string;
  quantity?: number;
}

interface ListingsItem {
  sku: string;
  summaries?: ItemSummary[];
  attributes?: Record<string, any>;
  issues?: Issue[];
  offers?: ItemOffer[];
  fulfillmentAvailability?: FulfillmentAvailability[];
  procurement?: Array<{
    costPrice: {
      currencyCode: string;
      amount: string;
    };
  }>;
  relationships?: Array<{
    marketplaceId: string;
    relationships: Array<{
      childSkus?: string[];
      parentSkus?: string[];
      variationTheme?: {
        attributes: string[];
        theme: string;
      };
      type: 'VARIATION' | 'PACKAGE_HIERARCHY';
    }>;
  }>;
  productTypes?: Array<{
    marketplaceId: string;
    productType: string;
  }>;
}

interface SearchListingsResponse {
  numberOfResults: number;
  pagination?: {
    nextToken?: string;
    previousToken?: string;
  };
  items: ListingsItem[];
}

export class ListingsService extends AmazonSPAPIClient {
  /**
   * Returns details about a listings item for a selling partner (v2021-08-01).
   */
  async getListingsItem(
    sellerId: string,
    sku: string,
    marketplaceIds: string[],
    includedData?: Array<'summaries' | 'attributes' | 'issues' | 'offers' | 'fulfillmentAvailability' | 'procurement' | 'relationships' | 'productTypes'>,
    issueLocale?: string
  ): Promise<ListingsItem> {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(','),
    };

    if (includedData && includedData.length > 0) {
      queryParams.includedData = includedData.join(',');
    }

    if (issueLocale) {
      queryParams.issueLocale = issueLocale;
    }

    return this.request<ListingsItem>({
      method: 'GET',
      path: `/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(sku)}`,
      queryParams,
    });
  }

  /**
   * Search for and return a list of selling partner listings items (v2021-08-01).
   */
  async searchListingsItems(
    sellerId: string,
    marketplaceIds: string[],
    includedData?: Array<'summaries' | 'attributes' | 'issues' | 'offers' | 'fulfillmentAvailability' | 'procurement' | 'relationships' | 'productTypes'>,
    identifiers?: string[],
    identifiersType?: 'ASIN' | 'EAN' | 'FNSKU' | 'GTIN' | 'ISBN' | 'JAN' | 'MINSAN' | 'SKU' | 'UPC',
    variationParentSku?: string,
    packageHierarchySku?: string,
    createdAfter?: string,
    createdBefore?: string,
    lastUpdatedAfter?: string,
    lastUpdatedBefore?: string,
    withIssueSeverity?: Array<'WARNING' | 'ERROR'>,
    withStatus?: Array<'BUYABLE' | 'DISCOVERABLE'>,
    withoutStatus?: Array<'BUYABLE' | 'DISCOVERABLE'>,
    sortBy?: 'sku' | 'createdDate' | 'lastUpdatedDate',
    sortOrder?: 'ASC' | 'DESC',
    pageSize?: number,
    pageToken?: string,
    issueLocale?: string
  ): Promise<SearchListingsResponse> {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(','),
    };

    if (includedData && includedData.length > 0) {
      queryParams.includedData = includedData.join(',');
    }

    if (identifiers && identifiers.length > 0) {
      queryParams.identifiers = identifiers.join(',');
    }

    if (identifiersType) {
      queryParams.identifiersType = identifiersType;
    }

    if (variationParentSku) queryParams.variationParentSku = variationParentSku;
    if (packageHierarchySku) queryParams.packageHierarchySku = packageHierarchySku;
    if (createdAfter) queryParams.createdAfter = createdAfter;
    if (createdBefore) queryParams.createdBefore = createdBefore;
    if (lastUpdatedAfter) queryParams.lastUpdatedAfter = lastUpdatedAfter;
    if (lastUpdatedBefore) queryParams.lastUpdatedBefore = lastUpdatedBefore;

    if (withIssueSeverity && withIssueSeverity.length > 0) {
      queryParams.withIssueSeverity = withIssueSeverity.join(',');
    }

    if (withStatus && withStatus.length > 0) {
      queryParams.withStatus = withStatus.join(',');
    }

    if (withoutStatus && withoutStatus.length > 0) {
      queryParams.withoutStatus = withoutStatus.join(',');
    }

    if (sortBy) queryParams.sortBy = sortBy;
    if (sortOrder) queryParams.sortOrder = sortOrder;
    if (pageSize) queryParams.pageSize = pageSize.toString();
    if (pageToken) queryParams.pageToken = pageToken;
    if (issueLocale) queryParams.issueLocale = issueLocale;

    return this.request<SearchListingsResponse>({
      method: 'GET',
      path: `/listings/2021-08-01/items/${sellerId}`,
      queryParams,
    });
  }

  /**
   * Creates a new or fully-updates an existing listings item (v2021-08-01).
   */
  async putListingsItem(
    sellerId: string,
    sku: string,
    marketplaceIds: string[],
    body: ListingsItemPutRequest,
    includedData?: Array<'identifiers' | 'issues'>,
    mode?: 'VALIDATION_PREVIEW',
    issueLocale?: string
  ): Promise<ListingsItemSubmissionResponse> {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(','),
    };

    if (includedData && includedData.length > 0) {
      queryParams.includedData = includedData.join(',');
    }

    if (mode) {
      queryParams.mode = mode;
    }

    if (issueLocale) {
      queryParams.issueLocale = issueLocale;
    }

    return this.request<ListingsItemSubmissionResponse>({
      method: 'PUT',
      path: `/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(sku)}`,
      queryParams,
      body,
    });
  }

  /**
   * Delete a listings item (v2021-08-01).
   */
  async deleteListingsItem(
    sellerId: string,
    sku: string,
    marketplaceIds: string[],
    issueLocale?: string
  ): Promise<ListingsItemSubmissionResponse> {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(','),
    };

    if (issueLocale) {
      queryParams.issueLocale = issueLocale;
    }

    return this.request<ListingsItemSubmissionResponse>({
      method: 'DELETE',
      path: `/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(sku)}`,
      queryParams,
    });
  }

  /**
   * Partially update (patch) a listings item (v2021-08-01).
   */
  async patchListingsItem(
    sellerId: string,
    sku: string,
    marketplaceIds: string[],
    body: ListingsItemPatchRequest,
    includedData?: Array<'identifiers' | 'issues'>,
    mode?: 'VALIDATION_PREVIEW',
    issueLocale?: string
  ): Promise<ListingsItemSubmissionResponse> {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(','),
    };

    if (includedData && includedData.length > 0) {
      queryParams.includedData = includedData.join(',');
    }

    if (mode) {
      queryParams.mode = mode;
    }

    if (issueLocale) {
      queryParams.issueLocale = issueLocale;
    }

    return this.request<ListingsItemSubmissionResponse>({
      method: 'PATCH',
      path: `/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(sku)}`,
      queryParams,
      body,
    });
  }

  // Legacy methods for v2020-09-01 API
  /**
   * Creates a new or fully-updates an existing listings item (v2020-09-01).
   * @deprecated Use putListingsItem instead
   */
  async putListingsItemLegacy(
    sellerId: string,
    sku: string,
    marketplaceIds: string[],
    body: ListingsItemPutRequest,
    issueLocale?: string
  ): Promise<ListingsItemSubmissionResponse> {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(','),
    };

    if (issueLocale) {
      queryParams.issueLocale = issueLocale;
    }

    return this.request<ListingsItemSubmissionResponse>({
      method: 'PUT',
      path: `/listings/2020-09-01/items/${sellerId}/${encodeURIComponent(sku)}`,
      queryParams,
      body,
    });
  }

  /**
   * Delete a listings item (v2020-09-01).
   * @deprecated Use deleteListingsItem instead
   */
  async deleteListingsItemLegacy(
    sellerId: string,
    sku: string,
    marketplaceIds: string[],
    issueLocale?: string
  ): Promise<ListingsItemSubmissionResponse> {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(','),
    };

    if (issueLocale) {
      queryParams.issueLocale = issueLocale;
    }

    return this.request<ListingsItemSubmissionResponse>({
      method: 'DELETE',
      path: `/listings/2020-09-01/items/${sellerId}/${encodeURIComponent(sku)}`,
      queryParams,
    });
  }

  /**
   * Partially update (patch) a listings item (v2020-09-01).
   * @deprecated Use patchListingsItem instead
   */
  async patchListingsItemLegacy(
    sellerId: string,
    sku: string,
    marketplaceIds: string[],
    body: ListingsItemPatchRequest,
    issueLocale?: string
  ): Promise<ListingsItemSubmissionResponse> {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(','),
    };

    if (issueLocale) {
      queryParams.issueLocale = issueLocale;
    }

    return this.request<ListingsItemSubmissionResponse>({
      method: 'PATCH',
      path: `/listings/2020-09-01/items/${sellerId}/${encodeURIComponent(sku)}`,
      queryParams,
      body,
    });
  }
}
