import { NextResponse } from 'next/server';
import { SellersApi, ApiClient as SellersApiClient } from '../../../../amazon_sdk/sellers/index';
import {AppConfig} from '../../../../../app.config.mjs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const sellerApiClient = new SellersApiClient(AppConfig.endpoint);
    const sellerApi = new SellersApi(sellerApiClient);
    sellerApiClient.enableAutoRetrievalAccessToken(AppConfig.lwaClientId, AppConfig.lwaClientSecret, AppConfig.lwaRefreshToken);
    const participations = await sellerApi.getMarketplaceParticipations();
    return NextResponse.json(participations);
  } catch (error) {
    console.error("Sellers API error:", error);
    return NextResponse.json({
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
