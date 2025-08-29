import { AmazonSPAPIClient } from '../client';

interface MarketplaceParticipation {
  marketplace: {
    id: string;
    name: string;
    countryCode: string;
    defaultCurrencyCode: string;
    defaultLanguageCode: string;
    domainName: string;
  };
  participation: {
    isParticipating: boolean;
    hasSuspendedListings: boolean;
  };
}

interface MarketplaceParticipationsResponse {
  payload: MarketplaceParticipation[];
}

export class SellersService extends AmazonSPAPIClient {
  async getMarketplaceParticipations(): Promise<MarketplaceParticipationsResponse> {
    return this.request<MarketplaceParticipationsResponse>({
      method: 'GET',
      path: '/sellers/v1/marketplaceParticipations',
    });
  }
}
