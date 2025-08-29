import { AmazonSPAPIClient } from '../client';

interface CatalogItem {
  asin: string;
  attributes?: Record<string, any>;
  identifiers?: Array<{
    identifierType: string;
    identifier: string;
  }>;
  images?: Array<{
    variant: string;
    link: string;
    height: number;
    width: number;
  }>;
  productTypes?: Array<{
    productType: string;
    marketplaceId: string;
  }>;
  salesRanks?: Array<{
    productCategoryId: string;
    rank: number;
    marketplaceId: string;
  }>;
}

interface SearchCatalogItemsResponse {
  numberOfResults: number;
  pagination?: {
    nextToken?: string;
  };
  refinements: Record<string, any>;
  items: CatalogItem[];
}

export class CatalogService extends AmazonSPAPIClient {
  async searchCatalogItems(
    marketplaceIds: string[],
    keywords?: string,
    brandNames?: string[],
    classificationIds?: string[]
  ): Promise<SearchCatalogItemsResponse> {
    const queryParams: Record<string, string> = {
      marketplaceIds: marketplaceIds.join(','),
    };

    if (keywords) queryParams.keywords = keywords;
    if (brandNames) queryParams.brandNames = brandNames.join(',');
    if (classificationIds) queryParams.classificationIds = classificationIds.join(',');

    return this.request<SearchCatalogItemsResponse>({
      method: 'GET',
      path: '/catalog/2022-04-01/items',
      queryParams,
    });
  }

  async getCatalogItem(asin: string, marketplaceIds: string[]): Promise<CatalogItem> {
    return this.request<CatalogItem>({
      method: 'GET',
      path: `/catalog/2022-04-01/items/${asin}`,
      queryParams: {
        marketplaceIds: marketplaceIds.join(','),
      },
    });
  }
}
