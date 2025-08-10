export * from './authorizationV202309Api';
import { AuthorizationV202309Api, AuthorizationV202309ApiOperationNames, AuthorizationV202309ApiOperationTypes } from './authorizationV202309Api';
export * from './authorizationV202312Api';
import { AuthorizationV202312Api, AuthorizationV202312ApiOperationNames, AuthorizationV202312ApiOperationTypes } from './authorizationV202312Api';
export * from './authorizationV202401Api';
import { AuthorizationV202401Api, AuthorizationV202401ApiOperationNames, AuthorizationV202401ApiOperationTypes } from './authorizationV202401Api';
export * from './authorizationV202403Api';
import { AuthorizationV202403Api, AuthorizationV202403ApiOperationNames, AuthorizationV202403ApiOperationTypes } from './authorizationV202403Api';
export * from './customerServiceV202309Api';
import { CustomerServiceV202309Api, CustomerServiceV202309ApiOperationNames, CustomerServiceV202309ApiOperationTypes } from './customerServiceV202309Api';
export * from './customerServiceV202407Api';
import { CustomerServiceV202407Api, CustomerServiceV202407ApiOperationNames, CustomerServiceV202407ApiOperationTypes } from './customerServiceV202407Api';
export * from './dataReconciliationV202309Api';
import { DataReconciliationV202309Api, DataReconciliationV202309ApiOperationNames, DataReconciliationV202309ApiOperationTypes } from './dataReconciliationV202309Api';
export * from './dataReconciliationV202310Api';
import { DataReconciliationV202310Api, DataReconciliationV202310ApiOperationNames, DataReconciliationV202310ApiOperationTypes } from './dataReconciliationV202310Api';
export * from './dataReconciliationV202401Api';
import { DataReconciliationV202401Api, DataReconciliationV202401ApiOperationNames, DataReconciliationV202401ApiOperationTypes } from './dataReconciliationV202401Api';
export * from './eventV202309Api';
import { EventV202309Api, EventV202309ApiOperationNames, EventV202309ApiOperationTypes } from './eventV202309Api';
export * from './financeV202309Api';
import { FinanceV202309Api, FinanceV202309ApiOperationNames, FinanceV202309ApiOperationTypes } from './financeV202309Api';
export * from './financeV202501Api';
import { FinanceV202501Api, FinanceV202501ApiOperationNames, FinanceV202501ApiOperationTypes } from './financeV202501Api';
export * from './financeV202506Api';
import { FinanceV202506Api, FinanceV202506ApiOperationNames, FinanceV202506ApiOperationTypes } from './financeV202506Api';
export * from './fulfillmentV202309Api';
import { FulfillmentV202309Api, FulfillmentV202309ApiOperationNames, FulfillmentV202309ApiOperationTypes } from './fulfillmentV202309Api';
export * from './fulfillmentV202407Api';
import { FulfillmentV202407Api, FulfillmentV202407ApiOperationNames, FulfillmentV202407ApiOperationTypes } from './fulfillmentV202407Api';
export * from './fulfillmentV202502Api';
import { FulfillmentV202502Api, FulfillmentV202502ApiOperationNames, FulfillmentV202502ApiOperationTypes } from './fulfillmentV202502Api';
export * from './logisticsV202309Api';
import { LogisticsV202309Api, LogisticsV202309ApiOperationNames, LogisticsV202309ApiOperationTypes } from './logisticsV202309Api';
export * from './orderV202309Api';
import { OrderV202309Api, OrderV202309ApiOperationNames, OrderV202309ApiOperationTypes } from './orderV202309Api';
export * from './orderV202407Api';
import { OrderV202407Api, OrderV202407ApiOperationNames, OrderV202407ApiOperationTypes } from './orderV202407Api';
export * from './productV202309Api';
import { ProductV202309Api, ProductV202309ApiOperationNames, ProductV202309ApiOperationTypes } from './productV202309Api';
export * from './productV202312Api';
import { ProductV202312Api, ProductV202312ApiOperationNames, ProductV202312ApiOperationTypes } from './productV202312Api';
export * from './productV202401Api';
import { ProductV202401Api, ProductV202401ApiOperationNames, ProductV202401ApiOperationTypes } from './productV202401Api';
export * from './productV202404Api';
import { ProductV202404Api, ProductV202404ApiOperationNames, ProductV202404ApiOperationTypes } from './productV202404Api';
export * from './productV202405Api';
import { ProductV202405Api, ProductV202405ApiOperationNames, ProductV202405ApiOperationTypes } from './productV202405Api';
export * from './productV202407Api';
import { ProductV202407Api, ProductV202407ApiOperationNames, ProductV202407ApiOperationTypes } from './productV202407Api';
export * from './productV202409Api';
import { ProductV202409Api, ProductV202409ApiOperationNames, ProductV202409ApiOperationTypes } from './productV202409Api';
export * from './productV202501Api';
import { ProductV202501Api, ProductV202501ApiOperationNames, ProductV202501ApiOperationTypes } from './productV202501Api';
export * from './productV202502Api';
import { ProductV202502Api, ProductV202502ApiOperationNames, ProductV202502ApiOperationTypes } from './productV202502Api';
export * from './productV202505Api';
import { ProductV202505Api, ProductV202505ApiOperationNames, ProductV202505ApiOperationTypes } from './productV202505Api';
export * from './productV202506Api';
import { ProductV202506Api, ProductV202506ApiOperationNames, ProductV202506ApiOperationTypes } from './productV202506Api';
export * from './promotionV202309Api';
import { PromotionV202309Api, PromotionV202309ApiOperationNames, PromotionV202309ApiOperationTypes } from './promotionV202309Api';
export * from './promotionV202406Api';
import { PromotionV202406Api, PromotionV202406ApiOperationNames, PromotionV202406ApiOperationTypes } from './promotionV202406Api';
export * from './returnRefundV202309Api';
import { ReturnRefundV202309Api, ReturnRefundV202309ApiOperationNames, ReturnRefundV202309ApiOperationTypes } from './returnRefundV202309Api';
export * from './sellerV202309Api';
import { SellerV202309Api, SellerV202309ApiOperationNames, SellerV202309ApiOperationTypes } from './sellerV202309Api';
export * from './supplyChainV202309Api';
import { SupplyChainV202309Api, SupplyChainV202309ApiOperationNames, SupplyChainV202309ApiOperationTypes } from './supplyChainV202309Api';
import * as http from 'http';

export class HttpError extends Error {
constructor (public response: http.IncomingMessage, public body: any, public statusCode?: number) {
super('HTTP request failed');
this.name = 'HttpError';
}
}

export type { RequestFile } from '../model/models';

export const APIS = [AuthorizationV202309Api, AuthorizationV202312Api, AuthorizationV202401Api, AuthorizationV202403Api, CustomerServiceV202309Api, CustomerServiceV202407Api, DataReconciliationV202309Api, DataReconciliationV202310Api, DataReconciliationV202401Api, EventV202309Api, FinanceV202309Api, FinanceV202501Api, FinanceV202506Api, FulfillmentV202309Api, FulfillmentV202407Api, FulfillmentV202502Api, LogisticsV202309Api, OrderV202309Api, OrderV202407Api, ProductV202309Api, ProductV202312Api, ProductV202401Api, ProductV202404Api, ProductV202405Api, ProductV202407Api, ProductV202409Api, ProductV202501Api, ProductV202502Api, ProductV202505Api, ProductV202506Api, PromotionV202309Api, PromotionV202406Api, ReturnRefundV202309Api, SellerV202309Api, SupplyChainV202309Api];

export enum API_ENUM {
    AuthorizationV202309Api='AuthorizationV202309Api', 
    AuthorizationV202312Api='AuthorizationV202312Api', 
    AuthorizationV202401Api='AuthorizationV202401Api', 
    AuthorizationV202403Api='AuthorizationV202403Api', 
    CustomerServiceV202309Api='CustomerServiceV202309Api', 
    CustomerServiceV202407Api='CustomerServiceV202407Api', 
    DataReconciliationV202309Api='DataReconciliationV202309Api', 
    DataReconciliationV202310Api='DataReconciliationV202310Api', 
    DataReconciliationV202401Api='DataReconciliationV202401Api', 
    EventV202309Api='EventV202309Api', 
    FinanceV202309Api='FinanceV202309Api', 
    FinanceV202501Api='FinanceV202501Api', 
    FinanceV202506Api='FinanceV202506Api', 
    FulfillmentV202309Api='FulfillmentV202309Api', 
    FulfillmentV202407Api='FulfillmentV202407Api', 
    FulfillmentV202502Api='FulfillmentV202502Api', 
    LogisticsV202309Api='LogisticsV202309Api', 
    OrderV202309Api='OrderV202309Api', 
    OrderV202407Api='OrderV202407Api', 
    ProductV202309Api='ProductV202309Api', 
    ProductV202312Api='ProductV202312Api', 
    ProductV202401Api='ProductV202401Api', 
    ProductV202404Api='ProductV202404Api', 
    ProductV202405Api='ProductV202405Api', 
    ProductV202407Api='ProductV202407Api', 
    ProductV202409Api='ProductV202409Api', 
    ProductV202501Api='ProductV202501Api', 
    ProductV202502Api='ProductV202502Api', 
    ProductV202505Api='ProductV202505Api', 
    ProductV202506Api='ProductV202506Api', 
    PromotionV202309Api='PromotionV202309Api', 
    PromotionV202406Api='PromotionV202406Api', 
    ReturnRefundV202309Api='ReturnRefundV202309Api', 
    SellerV202309Api='SellerV202309Api', 
    SupplyChainV202309Api='SupplyChainV202309Api'
}

export const API_OBJECT = {
    AuthorizationV202309Api:AuthorizationV202309Api, 
    AuthorizationV202312Api:AuthorizationV202312Api, 
    AuthorizationV202401Api:AuthorizationV202401Api, 
    AuthorizationV202403Api:AuthorizationV202403Api, 
    CustomerServiceV202309Api:CustomerServiceV202309Api, 
    CustomerServiceV202407Api:CustomerServiceV202407Api, 
    DataReconciliationV202309Api:DataReconciliationV202309Api, 
    DataReconciliationV202310Api:DataReconciliationV202310Api, 
    DataReconciliationV202401Api:DataReconciliationV202401Api, 
    EventV202309Api:EventV202309Api, 
    FinanceV202309Api:FinanceV202309Api, 
    FinanceV202501Api:FinanceV202501Api, 
    FinanceV202506Api:FinanceV202506Api, 
    FulfillmentV202309Api:FulfillmentV202309Api, 
    FulfillmentV202407Api:FulfillmentV202407Api, 
    FulfillmentV202502Api:FulfillmentV202502Api, 
    LogisticsV202309Api:LogisticsV202309Api, 
    OrderV202309Api:OrderV202309Api, 
    OrderV202407Api:OrderV202407Api, 
    ProductV202309Api:ProductV202309Api, 
    ProductV202312Api:ProductV202312Api, 
    ProductV202401Api:ProductV202401Api, 
    ProductV202404Api:ProductV202404Api, 
    ProductV202405Api:ProductV202405Api, 
    ProductV202407Api:ProductV202407Api, 
    ProductV202409Api:ProductV202409Api, 
    ProductV202501Api:ProductV202501Api, 
    ProductV202502Api:ProductV202502Api, 
    ProductV202505Api:ProductV202505Api, 
    ProductV202506Api:ProductV202506Api, 
    PromotionV202309Api:PromotionV202309Api, 
    PromotionV202406Api:PromotionV202406Api, 
    ReturnRefundV202309Api:ReturnRefundV202309Api, 
    SellerV202309Api:SellerV202309Api, 
    SupplyChainV202309Api:SupplyChainV202309Api
} as const;

export const API_OPERATION_NAME_MAP = {
    AuthorizationV202309Api:AuthorizationV202309ApiOperationNames, 
    AuthorizationV202312Api:AuthorizationV202312ApiOperationNames, 
    AuthorizationV202401Api:AuthorizationV202401ApiOperationNames, 
    AuthorizationV202403Api:AuthorizationV202403ApiOperationNames, 
    CustomerServiceV202309Api:CustomerServiceV202309ApiOperationNames, 
    CustomerServiceV202407Api:CustomerServiceV202407ApiOperationNames, 
    DataReconciliationV202309Api:DataReconciliationV202309ApiOperationNames, 
    DataReconciliationV202310Api:DataReconciliationV202310ApiOperationNames, 
    DataReconciliationV202401Api:DataReconciliationV202401ApiOperationNames, 
    EventV202309Api:EventV202309ApiOperationNames, 
    FinanceV202309Api:FinanceV202309ApiOperationNames, 
    FinanceV202501Api:FinanceV202501ApiOperationNames, 
    FinanceV202506Api:FinanceV202506ApiOperationNames, 
    FulfillmentV202309Api:FulfillmentV202309ApiOperationNames, 
    FulfillmentV202407Api:FulfillmentV202407ApiOperationNames, 
    FulfillmentV202502Api:FulfillmentV202502ApiOperationNames, 
    LogisticsV202309Api:LogisticsV202309ApiOperationNames, 
    OrderV202309Api:OrderV202309ApiOperationNames, 
    OrderV202407Api:OrderV202407ApiOperationNames, 
    ProductV202309Api:ProductV202309ApiOperationNames, 
    ProductV202312Api:ProductV202312ApiOperationNames, 
    ProductV202401Api:ProductV202401ApiOperationNames, 
    ProductV202404Api:ProductV202404ApiOperationNames, 
    ProductV202405Api:ProductV202405ApiOperationNames, 
    ProductV202407Api:ProductV202407ApiOperationNames, 
    ProductV202409Api:ProductV202409ApiOperationNames, 
    ProductV202501Api:ProductV202501ApiOperationNames, 
    ProductV202502Api:ProductV202502ApiOperationNames, 
    ProductV202505Api:ProductV202505ApiOperationNames, 
    ProductV202506Api:ProductV202506ApiOperationNames, 
    PromotionV202309Api:PromotionV202309ApiOperationNames, 
    PromotionV202406Api:PromotionV202406ApiOperationNames, 
    ReturnRefundV202309Api:ReturnRefundV202309ApiOperationNames, 
    SellerV202309Api:SellerV202309ApiOperationNames, 
    SupplyChainV202309Api:SupplyChainV202309ApiOperationNames
} as const;

export type API_OPERATION_TYPE_MAP = {
    AuthorizationV202309Api:AuthorizationV202309ApiOperationTypes;
    AuthorizationV202312Api:AuthorizationV202312ApiOperationTypes;
    AuthorizationV202401Api:AuthorizationV202401ApiOperationTypes;
    AuthorizationV202403Api:AuthorizationV202403ApiOperationTypes;
    CustomerServiceV202309Api:CustomerServiceV202309ApiOperationTypes;
    CustomerServiceV202407Api:CustomerServiceV202407ApiOperationTypes;
    DataReconciliationV202309Api:DataReconciliationV202309ApiOperationTypes;
    DataReconciliationV202310Api:DataReconciliationV202310ApiOperationTypes;
    DataReconciliationV202401Api:DataReconciliationV202401ApiOperationTypes;
    EventV202309Api:EventV202309ApiOperationTypes;
    FinanceV202309Api:FinanceV202309ApiOperationTypes;
    FinanceV202501Api:FinanceV202501ApiOperationTypes;
    FinanceV202506Api:FinanceV202506ApiOperationTypes;
    FulfillmentV202309Api:FulfillmentV202309ApiOperationTypes;
    FulfillmentV202407Api:FulfillmentV202407ApiOperationTypes;
    FulfillmentV202502Api:FulfillmentV202502ApiOperationTypes;
    LogisticsV202309Api:LogisticsV202309ApiOperationTypes;
    OrderV202309Api:OrderV202309ApiOperationTypes;
    OrderV202407Api:OrderV202407ApiOperationTypes;
    ProductV202309Api:ProductV202309ApiOperationTypes;
    ProductV202312Api:ProductV202312ApiOperationTypes;
    ProductV202401Api:ProductV202401ApiOperationTypes;
    ProductV202404Api:ProductV202404ApiOperationTypes;
    ProductV202405Api:ProductV202405ApiOperationTypes;
    ProductV202407Api:ProductV202407ApiOperationTypes;
    ProductV202409Api:ProductV202409ApiOperationTypes;
    ProductV202501Api:ProductV202501ApiOperationTypes;
    ProductV202502Api:ProductV202502ApiOperationTypes;
    ProductV202505Api:ProductV202505ApiOperationTypes;
    ProductV202506Api:ProductV202506ApiOperationTypes;
    PromotionV202309Api:PromotionV202309ApiOperationTypes;
    PromotionV202406Api:PromotionV202406ApiOperationTypes;
    ReturnRefundV202309Api:ReturnRefundV202309ApiOperationTypes;
    SellerV202309Api:SellerV202309ApiOperationTypes;
    SupplyChainV202309Api:SupplyChainV202309ApiOperationTypes;
};

