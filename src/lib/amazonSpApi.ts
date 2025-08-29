import { AppConfig } from '../../app.config.mjs';
import crypto from 'crypto';
import { sellersService } from './amazon-sp-api';

// Environment configuration
interface SPApiEnvironment {
  endpoint: string;
  marketplaceId: string;
  region: string;
  isSandbox: boolean;
}

const SP_API_ENVIRONMENTS: Record<string, SPApiEnvironment> = {
  production: {
    endpoint: 'sellingpartnerapi-na.amazon.com',
    marketplaceId: 'ATVPDKIKX0DER', // US marketplace
    region: 'us-east-1',
    isSandbox: false
  },
  sandbox: {
    endpoint: 'sandbox.sellingpartnerapi-na.amazon.com',
    marketplaceId: 'ATVPDKIKX0DER', // US marketplace
    region: 'us-east-1',
    isSandbox: true
  }
};

// Get current environment configuration
const getCurrentEnvironment = (): SPApiEnvironment => {
  const env = process.env.NODE_ENV || 'development';
  const spApiEnv = process.env.SP_API_ENVIRONMENT || (env === 'production' ? 'production' : 'sandbox');
  
  if (!SP_API_ENVIRONMENTS[spApiEnv]) {
    throw new Error(`Invalid SP API environment: ${spApiEnv}. Use 'production' or 'sandbox'.`);
  }
  
  return SP_API_ENVIRONMENTS[spApiEnv];
};

interface LWATokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Get LWA (Login with Amazon) access token
const getLWAAccessToken = async (): Promise<string> => {
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
  return tokenData.access_token;
};

// Create AWS Signature Version 4
const createAWSSignature = (
  method: string,
  uri: string,
  queryString: string,
  headers: Record<string, string>,
  payload: string,
  accessKey: string,
  secretKey: string,
  region: string,
  service: string
) => {
  const algorithm = 'AWS4-HMAC-SHA256';
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substr(0, 8);
  
  // Get current environment configuration
  const currentEnv = getCurrentEnvironment();
  
  // Add required headers
  headers['x-amz-date'] = amzDate;
  headers['host'] = currentEnv.endpoint;
  
  // Add sandbox header if in sandbox environment
  if (currentEnv.isSandbox) {
    headers['x-amz-access-token'] = 'sandbox'; // This will be replaced with actual LWA token
  }
  
  // Create canonical request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
    .join('');
    
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';');
    
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  
  const canonicalRequest = [
    method,
    uri,
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  // Calculate signature
  const getSignatureKey = (key: string, dateStamp: string, regionName: string, serviceName: string) => {
    const kDate = crypto.createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    return kSigning;
  };
  
  const signingKey = getSignatureKey(secretKey, dateStamp, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  
  // Create authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    'Authorization': authorizationHeader,
    'x-amz-date': amzDate
  };
};

// Helper function to make SP API requests
const makeSpApiRequest = async (
  endpoint: string, 
  method: string = 'GET', 
  body?: any,
  additionalHeaders?: Record<string, string>
): Promise<any> => {
  const currentEnv = getCurrentEnvironment();
  const accessToken = await getLWAAccessToken();
  
  const headers: Record<string, string> = {
    'x-amz-access-token': accessToken,
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  // Add sandbox-specific headers
  if (currentEnv.isSandbox) {
    headers['x-amz-target-marketplace'] = currentEnv.marketplaceId;
  }
  
  const url = `https://${currentEnv.endpoint}${endpoint}`;
  
  const requestOptions: RequestInit = {
    method,
    headers,
  };
  
  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }
  
  console.log(`Making SP API request to ${currentEnv.isSandbox ? 'SANDBOX' : 'PRODUCTION'}: ${url}`);
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SP API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
};

export const getMarketplaceParticipations = async () => {
  try {
    const currentEnv = getCurrentEnvironment();
    console.log(`Getting marketplace participations from ${currentEnv.isSandbox ? 'SANDBOX' : 'PRODUCTION'} environment`);
    
    // Use the new request helper or keep existing sellersService call
    const participations = await sellersService.getMarketplaceParticipations();
    console.log(JSON.stringify(participations, null, ' ') + '\n**********************************');
    
    return participations;
  } catch (error) {
    console.error('Exception when calling getMarketplaceParticipations API', error);
    throw error;
  }
};

// Export environment utilities
export const getEnvironmentInfo = () => {
  const currentEnv = getCurrentEnvironment();
  return {
    environment: currentEnv.isSandbox ? 'sandbox' : 'production',
    endpoint: currentEnv.endpoint,
    marketplaceId: currentEnv.marketplaceId,
    region: currentEnv.region,
    isSandbox: currentEnv.isSandbox
  };
};

// Export the request helper for other SP API calls
export { makeSpApiRequest };