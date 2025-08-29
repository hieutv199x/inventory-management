import { AppConfig } from '../../../app.config.mjs';
import crypto from 'crypto';

interface LWATokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SPAPIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  queryParams?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
}

export class AmazonSPAPIClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly baseUrl: string;
  private readonly region: string;

  constructor(region: string = 'us-east-1') {
    this.validateBaseConfig();
    // Normalize endpoint - remove protocol and trailing slash
    const raw = AppConfig.spApiNAEndpoint;
    this.baseUrl = raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.region = region;
  }

  private validateBaseConfig() {
    if (!AppConfig) {
      throw new Error('AppConfig is undefined. Ensure app.config.mjs exports AppConfig.');
    }
    const required = ['spApiNAEndpoint', 'lwaRefreshToken', 'lwaClientId', 'lwaClientSecret'] as const;
    const missing = required.filter(k => !AppConfig[k]);
    if (missing.length) {
      throw new Error(`Missing required AppConfig fields: ${missing.join(', ')}`);
    }
  }

  private validateAwsKeys(): boolean {
    return false; // Always return false since AWS keys are not available
  }

  private async getLWAAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    this.validateBaseConfig();

    const tokenUrl = 'https://api.amazon.com/auth/o2/token';
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: AppConfig.lwaRefreshToken,
      client_id: AppConfig.lwaClientId,
      client_secret: AppConfig.lwaClientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get LWA token: ${response.status} ${response.statusText}`);
    }

    const tokenData: LWATokenResponse = await response.json();
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000; // 60 seconds buffer
    
    return this.accessToken;
  }

  private createAWSSignature(
    method: string,
    uri: string,
    queryString: string,
    headers: Record<string, string>,
    payload: string
  ): Record<string, string> {
    // Skip AWS signature since credentials are not available
    return {};
  }

  async request<T>(options: SPAPIRequestOptions): Promise<T> {
    const { method = 'GET', path, queryParams, body, headers: customHeaders = {} } = options;
    
    const accessToken = await this.getLWAAccessToken();
    const payload = body ? JSON.stringify(body) : '';
    const queryString = queryParams 
      ? new URLSearchParams(queryParams).toString()
      : '';
    
    const headers: Record<string, string> = {
      'x-amz-access-token': accessToken,
      'x-amz-content-sha256': crypto.createHash('sha256').update(payload).digest('hex'),
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    // Skip AWS signature since credentials are not available

    const url = `https://${this.baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method,
      headers,
      body: payload || undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SP-API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}