import localVarRequest from 'request';

export * from './authorization/V202309/GetAuthorizedShopsResponse';
export * from './authorization/V202309/GetAuthorizedShopsResponseData';
export * from './authorization/V202309/GetAuthorizedShopsResponseDataShops';
export * from './authorization/V202312/GetWidgetTokenResponse';
export * from './authorization/V202312/GetWidgetTokenResponseData';
export * from './authorization/V202312/GetWidgetTokenResponseDataWidgetToken';
export * from './authorization/V202401/GetWidgetTokenResponse';
export * from './authorization/V202401/GetWidgetTokenResponseData';
export * from './authorization/V202401/GetWidgetTokenResponseDataWidgetToken';
export * from './authorization/V202403/DeauthorizeShopResponse';
export * from './customerService/V202309/CreateConversationRequestBody';
export * from './customerService/V202309/CreateConversationResponse';
export * from './customerService/V202309/CreateConversationResponseData';
export * from './customerService/V202309/GetAgentSettingsResponse';
export * from './customerService/V202309/GetAgentSettingsResponseData';
export * from './customerService/V202309/GetConversationMessagesResponse';
export * from './customerService/V202309/GetConversationMessagesResponseData';
export * from './customerService/V202309/GetConversationMessagesResponseDataMessages';
export * from './customerService/V202309/GetConversationMessagesResponseDataMessagesSender';
export * from './customerService/V202309/GetConversationsResponse';
export * from './customerService/V202309/GetConversationsResponseData';
export * from './customerService/V202309/GetConversationsResponseDataConversations';
export * from './customerService/V202309/GetConversationsResponseDataConversationsLatestMessage';
export * from './customerService/V202309/GetConversationsResponseDataConversationsLatestMessageSender';
export * from './customerService/V202309/GetConversationsResponseDataConversationsParticipants';
export * from './customerService/V202309/ReadMessageResponse';
export * from './customerService/V202309/SendMessageRequestBody';
export * from './customerService/V202309/SendMessageResponse';
export * from './customerService/V202309/SendMessageResponseData';
export * from './customerService/V202309/UpdateAgentSettingsRequestBody';
export * from './customerService/V202309/UpdateAgentSettingsResponse';
export * from './customerService/V202309/UploadBuyerMessagesImageResponse';
export * from './customerService/V202309/UploadBuyerMessagesImageResponseData';
export * from './customerService/V202407/GetCustomerServicePerformanceResponse';
export * from './customerService/V202407/GetCustomerServicePerformanceResponseData';
export * from './customerService/V202407/GetCustomerServicePerformanceResponseDataPerformance';
export * from './dataReconciliation/V202309/OrderStatusDataExchangeRequestBody';
export * from './dataReconciliation/V202309/OrderStatusDataExchangeRequestBodyOrders';
export * from './dataReconciliation/V202309/OrderStatusDataExchangeRequestBodyOrdersPackages';
export * from './dataReconciliation/V202309/OrderStatusDataExchangeResponse';
export * from './dataReconciliation/V202309/OrderStatusDataExchangeResponseData';
export * from './dataReconciliation/V202309/OrderStatusDataExchangeResponseDataErrors';
export * from './dataReconciliation/V202309/OrderStatusDataExchangeResponseDataErrorsDetail';
export * from './dataReconciliation/V202309/OrderStatusDataExchangeResponseDataErrorsDetailExtraErrors';
export * from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIRequestBody';
export * from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIRequestBodyOrders';
export * from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages';
export * from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponse';
export * from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponseData';
export * from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponseDataErrors';
export * from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponseDataErrorsDetail';
export * from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors';
export * from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIRequestBody';
export * from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIRequestBodyOrders';
export * from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages';
export * from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponse';
export * from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponseData';
export * from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponseDataErrors';
export * from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponseDataErrorsDetail';
export * from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors';
export * from './event/V202309/DeleteShopWebhookRequestBody';
export * from './event/V202309/DeleteShopWebhookResponse';
export * from './event/V202309/GetShopWebhooksResponse';
export * from './event/V202309/GetShopWebhooksResponseData';
export * from './event/V202309/GetShopWebhooksResponseDataWebhooks';
export * from './event/V202309/UpdateShopWebhookRequestBody';
export * from './event/V202309/UpdateShopWebhookResponse';
export * from './finance/V202309/GetPaymentsResponse';
export * from './finance/V202309/GetPaymentsResponseData';
export * from './finance/V202309/GetPaymentsResponseDataPayments';
export * from './finance/V202309/GetPaymentsResponseDataPaymentsAmount';
export * from './finance/V202309/GetPaymentsResponseDataPaymentsPaymentAmountBeforeExchange';
export * from './finance/V202309/GetPaymentsResponseDataPaymentsReserveAmount';
export * from './finance/V202309/GetPaymentsResponseDataPaymentsSettlementAmount';
export * from './finance/V202309/GetStatementsResponse';
export * from './finance/V202309/GetStatementsResponseData';
export * from './finance/V202309/GetStatementsResponseDataStatements';
export * from './finance/V202309/GetTransactionsbyOrderResponse';
export * from './finance/V202309/GetTransactionsbyOrderResponseData';
export * from './finance/V202309/GetTransactionsbyOrderResponseDataStatementTransactions';
export * from './finance/V202309/GetTransactionsbyOrderResponseDataStatementTransactionsSkuStatementTransactions';
export * from './finance/V202309/GetTransactionsbyStatementResponse';
export * from './finance/V202309/GetTransactionsbyStatementResponseData';
export * from './finance/V202309/GetTransactionsbyStatementResponseDataStatementTransactions';
export * from './finance/V202309/GetWithdrawalsResponse';
export * from './finance/V202309/GetWithdrawalsResponseData';
export * from './finance/V202309/GetWithdrawalsResponseDataWithdrawals';
export * from './finance/V202501/GetTransactionsbyOrderResponse';
export * from './finance/V202501/GetTransactionsbyOrderResponseData';
export * from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactions';
export * from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdown';
export * from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownFee';
export * from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownTax';
export * from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsRevenueBreakdown';
export * from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdown';
export * from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdownSupplementaryComponent';
export * from './finance/V202501/GetTransactionsbyStatementResponse';
export * from './finance/V202501/GetTransactionsbyStatementResponseData';
export * from './finance/V202501/GetTransactionsbyStatementResponseDataTotalSettlementBreakdown';
export * from './finance/V202501/GetTransactionsbyStatementResponseDataTransactions';
export * from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdown';
export * from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownFee';
export * from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownTax';
export * from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsRevenueBreakdown';
export * from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdown';
export * from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdownSupplementaryComponent';
export * from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsSupplementaryComponent';
export * from './finance/V202506/GetSellerunsettledtransactionResponse';
export * from './finance/V202506/GetSellerunsettledtransactionResponseData';
export * from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactions';
export * from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdown';
export * from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownFee';
export * from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownTax';
export * from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsRevenueBreakdown';
export * from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdown';
export * from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdownSupplementaryComponent';
export * from './fulfillment/V202309/BatchShipPackagesRequestBody';
export * from './fulfillment/V202309/BatchShipPackagesRequestBodyPackages';
export * from './fulfillment/V202309/BatchShipPackagesRequestBodyPackagesPickupSlot';
export * from './fulfillment/V202309/BatchShipPackagesRequestBodyPackagesSelfShipment';
export * from './fulfillment/V202309/BatchShipPackagesResponse';
export * from './fulfillment/V202309/BatchShipPackagesResponseData';
export * from './fulfillment/V202309/BatchShipPackagesResponseDataErrors';
export * from './fulfillment/V202309/BatchShipPackagesResponseDataErrorsDetail';
export * from './fulfillment/V202309/CombinePackageRequestBody';
export * from './fulfillment/V202309/CombinePackageRequestBodyCombinablePackages';
export * from './fulfillment/V202309/CombinePackageResponse';
export * from './fulfillment/V202309/CombinePackageResponseData';
export * from './fulfillment/V202309/CombinePackageResponseDataErrors';
export * from './fulfillment/V202309/CombinePackageResponseDataErrorsDetail';
export * from './fulfillment/V202309/CombinePackageResponseDataPackages';
export * from './fulfillment/V202309/CreatePackagesRequestBody';
export * from './fulfillment/V202309/CreatePackagesRequestBodyDimension';
export * from './fulfillment/V202309/CreatePackagesRequestBodyWeight';
export * from './fulfillment/V202309/CreatePackagesResponse';
export * from './fulfillment/V202309/CreatePackagesResponseData';
export * from './fulfillment/V202309/CreatePackagesResponseDataDimension';
export * from './fulfillment/V202309/CreatePackagesResponseDataShippingServiceInfo';
export * from './fulfillment/V202309/CreatePackagesResponseDataWeight';
export * from './fulfillment/V202309/FulfillmentUploadDeliveryFileResponse';
export * from './fulfillment/V202309/FulfillmentUploadDeliveryFileResponseData';
export * from './fulfillment/V202309/FulfillmentUploadDeliveryImageResponse';
export * from './fulfillment/V202309/FulfillmentUploadDeliveryImageResponseData';
export * from './fulfillment/V202309/GetEligibleShippingServiceRequestBody';
export * from './fulfillment/V202309/GetEligibleShippingServiceRequestBodyDimension';
export * from './fulfillment/V202309/GetEligibleShippingServiceRequestBodyWeight';
export * from './fulfillment/V202309/GetEligibleShippingServiceResponse';
export * from './fulfillment/V202309/GetEligibleShippingServiceResponseData';
export * from './fulfillment/V202309/GetEligibleShippingServiceResponseDataDimension';
export * from './fulfillment/V202309/GetEligibleShippingServiceResponseDataShippingServices';
export * from './fulfillment/V202309/GetEligibleShippingServiceResponseDataWeight';
export * from './fulfillment/V202309/GetHandoverTimeslotsResponse';
export * from './fulfillment/V202309/GetHandoverTimeslotsResponseData';
export * from './fulfillment/V202309/GetHandoverTimeslotsResponseDataPickupSlots';
export * from './fulfillment/V202309/GetOrderSplitAttributesResponse';
export * from './fulfillment/V202309/GetOrderSplitAttributesResponseData';
export * from './fulfillment/V202309/GetOrderSplitAttributesResponseDataSplitAttributes';
export * from './fulfillment/V202309/GetOrderSplitAttributesResponseDataSplitAttributesMustSplitReasons';
export * from './fulfillment/V202309/GetPackageDetailResponse';
export * from './fulfillment/V202309/GetPackageDetailResponseData';
export * from './fulfillment/V202309/GetPackageDetailResponseDataDimension';
export * from './fulfillment/V202309/GetPackageDetailResponseDataInsurance';
export * from './fulfillment/V202309/GetPackageDetailResponseDataOrders';
export * from './fulfillment/V202309/GetPackageDetailResponseDataOrdersSkus';
export * from './fulfillment/V202309/GetPackageDetailResponseDataPickupSlot';
export * from './fulfillment/V202309/GetPackageDetailResponseDataRecipientAddress';
export * from './fulfillment/V202309/GetPackageDetailResponseDataSenderAddress';
export * from './fulfillment/V202309/GetPackageDetailResponseDataWeight';
export * from './fulfillment/V202309/GetPackageHandoverTimeSlotsResponse';
export * from './fulfillment/V202309/GetPackageHandoverTimeSlotsResponseData';
export * from './fulfillment/V202309/GetPackageHandoverTimeSlotsResponseDataPickupSlots';
export * from './fulfillment/V202309/GetPackageShippingDocumentResponse';
export * from './fulfillment/V202309/GetPackageShippingDocumentResponseData';
export * from './fulfillment/V202309/GetTrackingResponse';
export * from './fulfillment/V202309/GetTrackingResponseData';
export * from './fulfillment/V202309/GetTrackingResponseDataTracking';
export * from './fulfillment/V202309/MarkPackageAsShippedRequestBody';
export * from './fulfillment/V202309/MarkPackageAsShippedResponse';
export * from './fulfillment/V202309/MarkPackageAsShippedResponseData';
export * from './fulfillment/V202309/MarkPackageAsShippedResponseDataWarning';
export * from './fulfillment/V202309/SchedulePackageHandoverRequestBody';
export * from './fulfillment/V202309/SchedulePackageHandoverRequestBodyPickupSlot';
export * from './fulfillment/V202309/SchedulePackageHandoverResponse';
export * from './fulfillment/V202309/SchedulePackageHandoverResponseData';
export * from './fulfillment/V202309/SchedulePackageHandoverResponseDataDimension';
export * from './fulfillment/V202309/SchedulePackageHandoverResponseDataWeight';
export * from './fulfillment/V202309/SearchCombinablePackagesResponse';
export * from './fulfillment/V202309/SearchCombinablePackagesResponseData';
export * from './fulfillment/V202309/SearchCombinablePackagesResponseDataCombinablePackages';
export * from './fulfillment/V202309/SearchPackageRequestBody';
export * from './fulfillment/V202309/SearchPackageResponse';
export * from './fulfillment/V202309/SearchPackageResponseData';
export * from './fulfillment/V202309/SearchPackageResponseDataPackages';
export * from './fulfillment/V202309/SearchPackageResponseDataPackagesOrders';
export * from './fulfillment/V202309/SearchPackageResponseDataPackagesOrdersSkus';
export * from './fulfillment/V202309/ShipPackageRequestBody';
export * from './fulfillment/V202309/ShipPackageRequestBodyPickupSlot';
export * from './fulfillment/V202309/ShipPackageRequestBodySelfShipment';
export * from './fulfillment/V202309/ShipPackageResponse';
export * from './fulfillment/V202309/SplitOrdersRequestBody';
export * from './fulfillment/V202309/SplitOrdersRequestBodySplittableGroups';
export * from './fulfillment/V202309/SplitOrdersResponse';
export * from './fulfillment/V202309/SplitOrdersResponseData';
export * from './fulfillment/V202309/SplitOrdersResponseDataPackages';
export * from './fulfillment/V202309/UncombinePackagesRequestBody';
export * from './fulfillment/V202309/UncombinePackagesResponse';
export * from './fulfillment/V202309/UncombinePackagesResponseData';
export * from './fulfillment/V202309/UncombinePackagesResponseDataPackages';
export * from './fulfillment/V202309/UpdatePackageDeliveryStatusRequestBody';
export * from './fulfillment/V202309/UpdatePackageDeliveryStatusRequestBodyPackages';
export * from './fulfillment/V202309/UpdatePackageDeliveryStatusResponse';
export * from './fulfillment/V202309/UpdatePackageDeliveryStatusResponseData';
export * from './fulfillment/V202309/UpdatePackageDeliveryStatusResponseDataErrors';
export * from './fulfillment/V202309/UpdatePackageDeliveryStatusResponseDataErrorsDetail';
export * from './fulfillment/V202309/UpdatePackageShippingInfoRequestBody';
export * from './fulfillment/V202309/UpdatePackageShippingInfoResponse';
export * from './fulfillment/V202309/UpdateShippingInfoRequestBody';
export * from './fulfillment/V202309/UpdateShippingInfoResponse';
export * from './fulfillment/V202407/CreateFirstMileBundleRequestBody';
export * from './fulfillment/V202407/CreateFirstMileBundleResponse';
export * from './fulfillment/V202407/CreateFirstMileBundleResponseData';
export * from './fulfillment/V202407/CreateFirstMileBundleResponseDataErrors';
export * from './fulfillment/V202407/CreateFirstMileBundleResponseDataErrorsDetail';
export * from './fulfillment/V202502/UploadInvoiceRequestBody';
export * from './fulfillment/V202502/UploadInvoiceRequestBodyInvoices';
export * from './fulfillment/V202502/UploadInvoiceResponse';
export * from './fulfillment/V202502/UploadInvoiceResponseData';
export * from './fulfillment/V202502/UploadInvoiceResponseDataErrors';
export * from './fulfillment/V202502/UploadInvoiceResponseDataErrorsDetail';
export * from './logistics/V202309/GetGlobalSellerWarehouseResponse';
export * from './logistics/V202309/GetGlobalSellerWarehouseResponseData';
export * from './logistics/V202309/GetGlobalSellerWarehouseResponseDataGlobalWarehouses';
export * from './logistics/V202309/GetShippingProvidersResponse';
export * from './logistics/V202309/GetShippingProvidersResponseData';
export * from './logistics/V202309/GetShippingProvidersResponseDataShippingProviders';
export * from './logistics/V202309/GetWarehouseDeliveryOptionsResponse';
export * from './logistics/V202309/GetWarehouseDeliveryOptionsResponseData';
export * from './logistics/V202309/GetWarehouseDeliveryOptionsResponseDataDeliveryOptions';
export * from './logistics/V202309/GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsDimensionLimit';
export * from './logistics/V202309/GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsWeightLimit';
export * from './logistics/V202309/GetWarehouseListResponse';
export * from './logistics/V202309/GetWarehouseListResponseData';
export * from './logistics/V202309/GetWarehouseListResponseDataWarehouses';
export * from './logistics/V202309/GetWarehouseListResponseDataWarehousesAddress';
export * from './logistics/V202309/GetWarehouseListResponseDataWarehousesAddressGeolocation';
export * from './order/V202309/GetOrderDetailResponse';
export * from './order/V202309/GetOrderDetailResponseData';
export * from './order/V202309/GetOrderDetailResponseDataOrders';
export * from './order/V202309/GetOrderDetailResponseDataOrdersHandlingDuration';
export * from './order/V202309/GetOrderDetailResponseDataOrdersLineItems';
export * from './order/V202309/GetOrderDetailResponseDataOrdersLineItemsCombinedListingSkus';
export * from './order/V202309/GetOrderDetailResponseDataOrdersLineItemsItemTax';
export * from './order/V202309/GetOrderDetailResponseDataOrdersPackages';
export * from './order/V202309/GetOrderDetailResponseDataOrdersPayment';
export * from './order/V202309/GetOrderDetailResponseDataOrdersRecipientAddress';
export * from './order/V202309/GetOrderDetailResponseDataOrdersRecipientAddressDeliveryPreferences';
export * from './order/V202309/GetOrderDetailResponseDataOrdersRecipientAddressDistrictInfo';
export * from './order/V202309/GetOrderListRequestBody';
export * from './order/V202309/GetOrderListResponse';
export * from './order/V202309/GetOrderListResponseData';
export * from './order/V202309/GetOrderListResponseDataOrders';
export * from './order/V202309/GetOrderListResponseDataOrdersHandlingDuration';
export * from './order/V202309/GetOrderListResponseDataOrdersLineItems';
export * from './order/V202309/GetOrderListResponseDataOrdersLineItemsCombinedListingSkus';
export * from './order/V202309/GetOrderListResponseDataOrdersLineItemsItemTax';
export * from './order/V202309/GetOrderListResponseDataOrdersPackages';
export * from './order/V202309/GetOrderListResponseDataOrdersPayment';
export * from './order/V202309/GetOrderListResponseDataOrdersRecipientAddress';
export * from './order/V202309/GetOrderListResponseDataOrdersRecipientAddressDeliveryPreferences';
export * from './order/V202309/GetOrderListResponseDataOrdersRecipientAddressDistrictInfo';
export * from './order/V202407/GetPriceDetailResponse';
export * from './order/V202407/GetPriceDetailResponseData';
export * from './order/V202407/GetPriceDetailResponseDataLineItems';
export * from './product/V202309/ActivateProductRequestBody';
export * from './product/V202309/ActivateProductResponse';
export * from './product/V202309/ActivateProductResponseData';
export * from './product/V202309/ActivateProductResponseDataErrors';
export * from './product/V202309/ActivateProductResponseDataErrorsDetail';
export * from './product/V202309/ActivateProductResponseDataErrorsDetailExtraErrors';
export * from './product/V202309/CheckListingPrerequisitesResponse';
export * from './product/V202309/CheckListingPrerequisitesResponseData';
export * from './product/V202309/CheckListingPrerequisitesResponseDataShop';
export * from './product/V202309/CheckListingPrerequisitesResponseDataShopGne';
export * from './product/V202309/CheckListingPrerequisitesResponseDataShopLogistics';
export * from './product/V202309/CheckProductListingRequestBody';
export * from './product/V202309/CheckProductListingRequestBodyCertifications';
export * from './product/V202309/CheckProductListingRequestBodyCertificationsFiles';
export * from './product/V202309/CheckProductListingRequestBodyCertificationsImages';
export * from './product/V202309/CheckProductListingRequestBodyMainImages';
export * from './product/V202309/CheckProductListingRequestBodyPackageDimensions';
export * from './product/V202309/CheckProductListingRequestBodyPackageWeight';
export * from './product/V202309/CheckProductListingRequestBodyProductAttributes';
export * from './product/V202309/CheckProductListingRequestBodyProductAttributesValues';
export * from './product/V202309/CheckProductListingRequestBodySizeChart';
export * from './product/V202309/CheckProductListingRequestBodySizeChartImage';
export * from './product/V202309/CheckProductListingRequestBodySizeChartTemplate';
export * from './product/V202309/CheckProductListingRequestBodySkus';
export * from './product/V202309/CheckProductListingRequestBodySkusCombinedSkus';
export * from './product/V202309/CheckProductListingRequestBodySkusExternalListPrices';
export * from './product/V202309/CheckProductListingRequestBodySkusIdentifierCode';
export * from './product/V202309/CheckProductListingRequestBodySkusInventory';
export * from './product/V202309/CheckProductListingRequestBodySkusListPrice';
export * from './product/V202309/CheckProductListingRequestBodySkusPreSale';
export * from './product/V202309/CheckProductListingRequestBodySkusPreSaleFulfillmentType';
export * from './product/V202309/CheckProductListingRequestBodySkusPrice';
export * from './product/V202309/CheckProductListingRequestBodySkusSalesAttributes';
export * from './product/V202309/CheckProductListingRequestBodySkusSalesAttributesSkuImg';
export * from './product/V202309/CheckProductListingRequestBodySkusSalesAttributesSupplementarySkuImages';
export * from './product/V202309/CheckProductListingRequestBodyVideo';
export * from './product/V202309/CheckProductListingResponse';
export * from './product/V202309/CheckProductListingResponseData';
export * from './product/V202309/CheckProductListingResponseDataDiagnoses';
export * from './product/V202309/CheckProductListingResponseDataDiagnosesDiagnosisResults';
export * from './product/V202309/CheckProductListingResponseDataDiagnosesSuggestions';
export * from './product/V202309/CheckProductListingResponseDataDiagnosesSuggestionsImages';
export * from './product/V202309/CheckProductListingResponseDataDiagnosesSuggestionsSeoWords';
export * from './product/V202309/CheckProductListingResponseDataDiagnosesSuggestionsSmartTexts';
export * from './product/V202309/CheckProductListingResponseDataFailReasons';
export * from './product/V202309/CheckProductListingResponseDataListingQuality';
export * from './product/V202309/CheckProductListingResponseDataWarnings';
export * from './product/V202309/CreateCustomBrandsRequestBody';
export * from './product/V202309/CreateCustomBrandsResponse';
export * from './product/V202309/CreateCustomBrandsResponseData';
export * from './product/V202309/CreateGlobalProductRequestBody';
export * from './product/V202309/CreateGlobalProductRequestBodyCertifications';
export * from './product/V202309/CreateGlobalProductRequestBodyCertificationsFiles';
export * from './product/V202309/CreateGlobalProductRequestBodyCertificationsImages';
export * from './product/V202309/CreateGlobalProductRequestBodyMainImages';
export * from './product/V202309/CreateGlobalProductRequestBodyManufacturer';
export * from './product/V202309/CreateGlobalProductRequestBodyPackageDimensions';
export * from './product/V202309/CreateGlobalProductRequestBodyPackageWeight';
export * from './product/V202309/CreateGlobalProductRequestBodyProductAttributes';
export * from './product/V202309/CreateGlobalProductRequestBodyProductAttributesValues';
export * from './product/V202309/CreateGlobalProductRequestBodySizeChart';
export * from './product/V202309/CreateGlobalProductRequestBodySizeChartImage';
export * from './product/V202309/CreateGlobalProductRequestBodySizeChartTemplate';
export * from './product/V202309/CreateGlobalProductRequestBodySkus';
export * from './product/V202309/CreateGlobalProductRequestBodySkusIdentifierCode';
export * from './product/V202309/CreateGlobalProductRequestBodySkusInventory';
export * from './product/V202309/CreateGlobalProductRequestBodySkusPrice';
export * from './product/V202309/CreateGlobalProductRequestBodySkusSalesAttributes';
export * from './product/V202309/CreateGlobalProductRequestBodySkusSalesAttributesSkuImg';
export * from './product/V202309/CreateGlobalProductRequestBodyVideo';
export * from './product/V202309/CreateGlobalProductResponse';
export * from './product/V202309/CreateGlobalProductResponseData';
export * from './product/V202309/CreateGlobalProductResponseDataGlobalSkus';
export * from './product/V202309/CreateGlobalProductResponseDataGlobalSkusSalesAttributes';
export * from './product/V202309/CreateProductRequestBody';
export * from './product/V202309/CreateProductRequestBodyCertifications';
export * from './product/V202309/CreateProductRequestBodyCertificationsFiles';
export * from './product/V202309/CreateProductRequestBodyCertificationsImages';
export * from './product/V202309/CreateProductRequestBodyMainImages';
export * from './product/V202309/CreateProductRequestBodyPackageDimensions';
export * from './product/V202309/CreateProductRequestBodyPackageWeight';
export * from './product/V202309/CreateProductRequestBodyProductAttributes';
export * from './product/V202309/CreateProductRequestBodyProductAttributesValues';
export * from './product/V202309/CreateProductRequestBodySizeChart';
export * from './product/V202309/CreateProductRequestBodySizeChartImage';
export * from './product/V202309/CreateProductRequestBodySizeChartTemplate';
export * from './product/V202309/CreateProductRequestBodySkus';
export * from './product/V202309/CreateProductRequestBodySkusCombinedSkus';
export * from './product/V202309/CreateProductRequestBodySkusExternalListPrices';
export * from './product/V202309/CreateProductRequestBodySkusIdentifierCode';
export * from './product/V202309/CreateProductRequestBodySkusInventory';
export * from './product/V202309/CreateProductRequestBodySkusListPrice';
export * from './product/V202309/CreateProductRequestBodySkusPreSale';
export * from './product/V202309/CreateProductRequestBodySkusPreSaleFulfillmentType';
export * from './product/V202309/CreateProductRequestBodySkusPrice';
export * from './product/V202309/CreateProductRequestBodySkusSalesAttributes';
export * from './product/V202309/CreateProductRequestBodySkusSalesAttributesSkuImg';
export * from './product/V202309/CreateProductRequestBodySkusSalesAttributesSupplementarySkuImages';
export * from './product/V202309/CreateProductRequestBodyVideo';
export * from './product/V202309/CreateProductResponse';
export * from './product/V202309/CreateProductResponseData';
export * from './product/V202309/CreateProductResponseDataSkus';
export * from './product/V202309/CreateProductResponseDataSkusSalesAttributes';
export * from './product/V202309/CreateProductResponseDataWarnings';
export * from './product/V202309/DeactivateProductsRequestBody';
export * from './product/V202309/DeactivateProductsResponse';
export * from './product/V202309/DeactivateProductsResponseData';
export * from './product/V202309/DeactivateProductsResponseDataErrors';
export * from './product/V202309/DeactivateProductsResponseDataErrorsDetail';
export * from './product/V202309/DeleteGlobalProductsRequestBody';
export * from './product/V202309/DeleteGlobalProductsResponse';
export * from './product/V202309/DeleteGlobalProductsResponseData';
export * from './product/V202309/DeleteGlobalProductsResponseDataErrors';
export * from './product/V202309/DeleteGlobalProductsResponseDataErrorsDetail';
export * from './product/V202309/DeleteProductsRequestBody';
export * from './product/V202309/DeleteProductsResponse';
export * from './product/V202309/DeleteProductsResponseData';
export * from './product/V202309/DeleteProductsResponseDataErrors';
export * from './product/V202309/DeleteProductsResponseDataErrorsDetail';
export * from './product/V202309/EditGlobalProductRequestBody';
export * from './product/V202309/EditGlobalProductRequestBodyCertifications';
export * from './product/V202309/EditGlobalProductRequestBodyCertificationsFiles';
export * from './product/V202309/EditGlobalProductRequestBodyCertificationsImages';
export * from './product/V202309/EditGlobalProductRequestBodyMainImages';
export * from './product/V202309/EditGlobalProductRequestBodyManufacturer';
export * from './product/V202309/EditGlobalProductRequestBodyPackageDimensions';
export * from './product/V202309/EditGlobalProductRequestBodyPackageWeight';
export * from './product/V202309/EditGlobalProductRequestBodyProductAttributes';
export * from './product/V202309/EditGlobalProductRequestBodyProductAttributesValues';
export * from './product/V202309/EditGlobalProductRequestBodySizeChart';
export * from './product/V202309/EditGlobalProductRequestBodySizeChartImage';
export * from './product/V202309/EditGlobalProductRequestBodySizeChartTemplate';
export * from './product/V202309/EditGlobalProductRequestBodySkus';
export * from './product/V202309/EditGlobalProductRequestBodySkusIdentifierCode';
export * from './product/V202309/EditGlobalProductRequestBodySkusInventory';
export * from './product/V202309/EditGlobalProductRequestBodySkusPrice';
export * from './product/V202309/EditGlobalProductRequestBodySkusSalePrices';
export * from './product/V202309/EditGlobalProductRequestBodySkusSalesAttributes';
export * from './product/V202309/EditGlobalProductRequestBodySkusSalesAttributesSkuImg';
export * from './product/V202309/EditGlobalProductRequestBodyVideo';
export * from './product/V202309/EditGlobalProductResponse';
export * from './product/V202309/EditGlobalProductResponseData';
export * from './product/V202309/EditGlobalProductResponseDataGlobalSkus';
export * from './product/V202309/EditGlobalProductResponseDataGlobalSkusSalesAttributes';
export * from './product/V202309/EditGlobalProductResponseDataPublishResults';
export * from './product/V202309/EditGlobalProductResponseDataPublishResultsFailReasons';
export * from './product/V202309/EditProductRequestBody';
export * from './product/V202309/EditProductRequestBodyCertifications';
export * from './product/V202309/EditProductRequestBodyCertificationsFiles';
export * from './product/V202309/EditProductRequestBodyCertificationsImages';
export * from './product/V202309/EditProductRequestBodyMainImages';
export * from './product/V202309/EditProductRequestBodyPackageDimensions';
export * from './product/V202309/EditProductRequestBodyPackageWeight';
export * from './product/V202309/EditProductRequestBodyProductAttributes';
export * from './product/V202309/EditProductRequestBodyProductAttributesValues';
export * from './product/V202309/EditProductRequestBodySizeChart';
export * from './product/V202309/EditProductRequestBodySizeChartImage';
export * from './product/V202309/EditProductRequestBodySizeChartTemplate';
export * from './product/V202309/EditProductRequestBodySkus';
export * from './product/V202309/EditProductRequestBodySkusCombinedSkus';
export * from './product/V202309/EditProductRequestBodySkusExternalListPrices';
export * from './product/V202309/EditProductRequestBodySkusIdentifierCode';
export * from './product/V202309/EditProductRequestBodySkusInventory';
export * from './product/V202309/EditProductRequestBodySkusListPrice';
export * from './product/V202309/EditProductRequestBodySkusPreSale';
export * from './product/V202309/EditProductRequestBodySkusPreSaleFulfillmentType';
export * from './product/V202309/EditProductRequestBodySkusPrice';
export * from './product/V202309/EditProductRequestBodySkusSalesAttributes';
export * from './product/V202309/EditProductRequestBodySkusSalesAttributesSkuImg';
export * from './product/V202309/EditProductRequestBodySkusSalesAttributesSupplementarySkuImages';
export * from './product/V202309/EditProductRequestBodyVideo';
export * from './product/V202309/EditProductResponse';
export * from './product/V202309/EditProductResponseData';
export * from './product/V202309/EditProductResponseDataAudit';
export * from './product/V202309/EditProductResponseDataSkus';
export * from './product/V202309/EditProductResponseDataSkusSalesAttributes';
export * from './product/V202309/EditProductResponseDataWarnings';
export * from './product/V202309/GetAttributesResponse';
export * from './product/V202309/GetAttributesResponseData';
export * from './product/V202309/GetAttributesResponseDataAttributes';
export * from './product/V202309/GetAttributesResponseDataAttributesRequirementConditions';
export * from './product/V202309/GetAttributesResponseDataAttributesValues';
export * from './product/V202309/GetBrandsResponse';
export * from './product/V202309/GetBrandsResponseData';
export * from './product/V202309/GetBrandsResponseDataBrands';
export * from './product/V202309/GetCategoriesResponse';
export * from './product/V202309/GetCategoriesResponseData';
export * from './product/V202309/GetCategoriesResponseDataCategories';
export * from './product/V202309/GetCategoryRulesResponse';
export * from './product/V202309/GetCategoryRulesResponseData';
export * from './product/V202309/GetCategoryRulesResponseDataCod';
export * from './product/V202309/GetCategoryRulesResponseDataEpr';
export * from './product/V202309/GetCategoryRulesResponseDataManufacturer';
export * from './product/V202309/GetCategoryRulesResponseDataPackageDimension';
export * from './product/V202309/GetCategoryRulesResponseDataProductCertifications';
export * from './product/V202309/GetCategoryRulesResponseDataProductCertificationsExpirationDate';
export * from './product/V202309/GetCategoryRulesResponseDataProductCertificationsRequirementConditions';
export * from './product/V202309/GetCategoryRulesResponseDataResponsiblePerson';
export * from './product/V202309/GetCategoryRulesResponseDataSizeChart';
export * from './product/V202309/GetGlobalAttributesResponse';
export * from './product/V202309/GetGlobalAttributesResponseData';
export * from './product/V202309/GetGlobalAttributesResponseDataAttributes';
export * from './product/V202309/GetGlobalAttributesResponseDataAttributesRequirementConditions';
export * from './product/V202309/GetGlobalAttributesResponseDataAttributesValues';
export * from './product/V202309/GetGlobalCategoriesResponse';
export * from './product/V202309/GetGlobalCategoriesResponseData';
export * from './product/V202309/GetGlobalCategoriesResponseDataCategories';
export * from './product/V202309/GetGlobalCategoryRulesResponse';
export * from './product/V202309/GetGlobalCategoryRulesResponseData';
export * from './product/V202309/GetGlobalCategoryRulesResponseDataManufacturer';
export * from './product/V202309/GetGlobalCategoryRulesResponseDataProductCertifications';
export * from './product/V202309/GetGlobalCategoryRulesResponseDataProductCertificationsRequirementConditions';
export * from './product/V202309/GetGlobalCategoryRulesResponseDataResponsiblePerson';
export * from './product/V202309/GetGlobalCategoryRulesResponseDataSizeChart';
export * from './product/V202309/GetGlobalProductResponse';
export * from './product/V202309/GetGlobalProductResponseData';
export * from './product/V202309/GetGlobalProductResponseDataBrand';
export * from './product/V202309/GetGlobalProductResponseDataCategory';
export * from './product/V202309/GetGlobalProductResponseDataCertifications';
export * from './product/V202309/GetGlobalProductResponseDataCertificationsFiles';
export * from './product/V202309/GetGlobalProductResponseDataCertificationsImages';
export * from './product/V202309/GetGlobalProductResponseDataMainImages';
export * from './product/V202309/GetGlobalProductResponseDataManufacturer';
export * from './product/V202309/GetGlobalProductResponseDataPackageDimensions';
export * from './product/V202309/GetGlobalProductResponseDataPackageWeight';
export * from './product/V202309/GetGlobalProductResponseDataProductAttributes';
export * from './product/V202309/GetGlobalProductResponseDataProductAttributesValues';
export * from './product/V202309/GetGlobalProductResponseDataProducts';
export * from './product/V202309/GetGlobalProductResponseDataProductsSkuMappings';
export * from './product/V202309/GetGlobalProductResponseDataProductsSkuMappingsSalesAttributeMappings';
export * from './product/V202309/GetGlobalProductResponseDataSizeChart';
export * from './product/V202309/GetGlobalProductResponseDataSizeChartImage';
export * from './product/V202309/GetGlobalProductResponseDataSizeChartTemplate';
export * from './product/V202309/GetGlobalProductResponseDataSkus';
export * from './product/V202309/GetGlobalProductResponseDataSkusIdentifierCode';
export * from './product/V202309/GetGlobalProductResponseDataSkusInventory';
export * from './product/V202309/GetGlobalProductResponseDataSkusPrice';
export * from './product/V202309/GetGlobalProductResponseDataSkusSalesAttributes';
export * from './product/V202309/GetGlobalProductResponseDataSkusSalesAttributesSkuImg';
export * from './product/V202309/GetGlobalProductResponseDataVideo';
export * from './product/V202309/GetProductResponse';
export * from './product/V202309/GetProductResponseData';
export * from './product/V202309/GetProductResponseDataAudit';
export * from './product/V202309/GetProductResponseDataAuditFailedReasons';
export * from './product/V202309/GetProductResponseDataBrand';
export * from './product/V202309/GetProductResponseDataCategoryChains';
export * from './product/V202309/GetProductResponseDataCertifications';
export * from './product/V202309/GetProductResponseDataCertificationsFiles';
export * from './product/V202309/GetProductResponseDataCertificationsImages';
export * from './product/V202309/GetProductResponseDataDeliveryOptions';
export * from './product/V202309/GetProductResponseDataGlobalProductAssociation';
export * from './product/V202309/GetProductResponseDataGlobalProductAssociationSkuMappings';
export * from './product/V202309/GetProductResponseDataGlobalProductAssociationSkuMappingsSalesAttributeMappings';
export * from './product/V202309/GetProductResponseDataIntegratedPlatformStatuses';
export * from './product/V202309/GetProductResponseDataMainImages';
export * from './product/V202309/GetProductResponseDataPackageDimensions';
export * from './product/V202309/GetProductResponseDataPackageWeight';
export * from './product/V202309/GetProductResponseDataPrescriptionRequirement';
export * from './product/V202309/GetProductResponseDataProductAttributes';
export * from './product/V202309/GetProductResponseDataProductAttributesValues';
export * from './product/V202309/GetProductResponseDataProductFamilies';
export * from './product/V202309/GetProductResponseDataProductFamiliesProducts';
export * from './product/V202309/GetProductResponseDataRecommendedCategories';
export * from './product/V202309/GetProductResponseDataSizeChart';
export * from './product/V202309/GetProductResponseDataSizeChartImage';
export * from './product/V202309/GetProductResponseDataSizeChartTemplate';
export * from './product/V202309/GetProductResponseDataSkus';
export * from './product/V202309/GetProductResponseDataSkusCombinedSkus';
export * from './product/V202309/GetProductResponseDataSkusExternalListPrices';
export * from './product/V202309/GetProductResponseDataSkusGlobalListingPolicy';
export * from './product/V202309/GetProductResponseDataSkusGlobalListingPolicyReplicateSource';
export * from './product/V202309/GetProductResponseDataSkusIdentifierCode';
export * from './product/V202309/GetProductResponseDataSkusInventory';
export * from './product/V202309/GetProductResponseDataSkusListPrice';
export * from './product/V202309/GetProductResponseDataSkusPreSale';
export * from './product/V202309/GetProductResponseDataSkusPreSaleFulfillmentType';
export * from './product/V202309/GetProductResponseDataSkusPrice';
export * from './product/V202309/GetProductResponseDataSkusSalesAttributes';
export * from './product/V202309/GetProductResponseDataSkusSalesAttributesSkuImg';
export * from './product/V202309/GetProductResponseDataSkusSalesAttributesSupplementarySkuImages';
export * from './product/V202309/GetProductResponseDataVideo';
export * from './product/V202309/InventorySearchRequestBody';
export * from './product/V202309/InventorySearchResponse';
export * from './product/V202309/InventorySearchResponseData';
export * from './product/V202309/InventorySearchResponseDataInventory';
export * from './product/V202309/InventorySearchResponseDataInventorySkus';
export * from './product/V202309/InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistribution';
export * from './product/V202309/InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCampaignInventory';
export * from './product/V202309/InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCreatorInventory';
export * from './product/V202309/InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionInShopInventory';
export * from './product/V202309/InventorySearchResponseDataInventorySkusWarehouseInventory';
export * from './product/V202309/PartialEditProductRequestBody';
export * from './product/V202309/PartialEditProductRequestBodyCertifications';
export * from './product/V202309/PartialEditProductRequestBodyCertificationsFiles';
export * from './product/V202309/PartialEditProductRequestBodyCertificationsImages';
export * from './product/V202309/PartialEditProductRequestBodyMainImages';
export * from './product/V202309/PartialEditProductRequestBodyPackageDimensions';
export * from './product/V202309/PartialEditProductRequestBodyPackageWeight';
export * from './product/V202309/PartialEditProductRequestBodyProductAttributes';
export * from './product/V202309/PartialEditProductRequestBodyProductAttributesValues';
export * from './product/V202309/PartialEditProductRequestBodySizeChart';
export * from './product/V202309/PartialEditProductRequestBodySizeChartImage';
export * from './product/V202309/PartialEditProductRequestBodySizeChartTemplate';
export * from './product/V202309/PartialEditProductRequestBodySkus';
export * from './product/V202309/PartialEditProductRequestBodySkusExternalListPrices';
export * from './product/V202309/PartialEditProductRequestBodySkusIdentifierCode';
export * from './product/V202309/PartialEditProductRequestBodySkusInventory';
export * from './product/V202309/PartialEditProductRequestBodySkusListPrice';
export * from './product/V202309/PartialEditProductRequestBodySkusPreSale';
export * from './product/V202309/PartialEditProductRequestBodySkusPreSaleFulfillmentType';
export * from './product/V202309/PartialEditProductRequestBodySkusPrice';
export * from './product/V202309/PartialEditProductRequestBodySkusSalesAttributes';
export * from './product/V202309/PartialEditProductRequestBodySkusSalesAttributesSkuImg';
export * from './product/V202309/PartialEditProductRequestBodySkusSalesAttributesSupplementarySkuImages';
export * from './product/V202309/PartialEditProductRequestBodyVideo';
export * from './product/V202309/PartialEditProductResponse';
export * from './product/V202309/PartialEditProductResponseData';
export * from './product/V202309/PartialEditProductResponseDataAudit';
export * from './product/V202309/PartialEditProductResponseDataSkus';
export * from './product/V202309/PartialEditProductResponseDataSkusSalesAttributes';
export * from './product/V202309/PublishGlobalProductRequestBody';
export * from './product/V202309/PublishGlobalProductRequestBodyPublishTarget';
export * from './product/V202309/PublishGlobalProductRequestBodyPublishTargetSkus';
export * from './product/V202309/PublishGlobalProductRequestBodyPublishTargetSkusInventory';
export * from './product/V202309/PublishGlobalProductRequestBodyPublishTargetSkusPrice';
export * from './product/V202309/PublishGlobalProductResponse';
export * from './product/V202309/PublishGlobalProductResponseData';
export * from './product/V202309/PublishGlobalProductResponseDataProducts';
export * from './product/V202309/PublishGlobalProductResponseDataProductsSkus';
export * from './product/V202309/PublishGlobalProductResponseDataProductsSkusSaleAttributes';
export * from './product/V202309/PublishGlobalProductResponseDataPublishResult';
export * from './product/V202309/PublishGlobalProductResponseDataPublishResultFailReasons';
export * from './product/V202309/RecommendCategoryRequestBody';
export * from './product/V202309/RecommendCategoryRequestBodyImages';
export * from './product/V202309/RecommendCategoryResponse';
export * from './product/V202309/RecommendCategoryResponseData';
export * from './product/V202309/RecommendCategoryResponseDataCategories';
export * from './product/V202309/RecommendGlobalCategoriesRequestBody';
export * from './product/V202309/RecommendGlobalCategoriesRequestBodyImages';
export * from './product/V202309/RecommendGlobalCategoriesResponse';
export * from './product/V202309/RecommendGlobalCategoriesResponseData';
export * from './product/V202309/RecommendGlobalCategoriesResponseDataCategories';
export * from './product/V202309/RecoverProductsRequestBody';
export * from './product/V202309/RecoverProductsResponse';
export * from './product/V202309/RecoverProductsResponseData';
export * from './product/V202309/RecoverProductsResponseDataErrors';
export * from './product/V202309/RecoverProductsResponseDataErrorsDetail';
export * from './product/V202309/SearchGlobalProductsRequestBody';
export * from './product/V202309/SearchGlobalProductsResponse';
export * from './product/V202309/SearchGlobalProductsResponseData';
export * from './product/V202309/SearchGlobalProductsResponseDataGlobalProducts';
export * from './product/V202309/SearchGlobalProductsResponseDataGlobalProductsSkus';
export * from './product/V202309/SearchProductsRequestBody';
export * from './product/V202309/SearchProductsResponse';
export * from './product/V202309/SearchProductsResponseData';
export * from './product/V202309/SearchProductsResponseDataProducts';
export * from './product/V202309/SearchProductsResponseDataProductsRecommendedCategories';
export * from './product/V202309/SearchProductsResponseDataProductsSkus';
export * from './product/V202309/SearchProductsResponseDataProductsSkusInventory';
export * from './product/V202309/SearchProductsResponseDataProductsSkusPrice';
export * from './product/V202309/UpdateGlobalInventoryRequestBody';
export * from './product/V202309/UpdateGlobalInventoryRequestBodyGlobalSkus';
export * from './product/V202309/UpdateGlobalInventoryRequestBodyGlobalSkusInventory';
export * from './product/V202309/UpdateGlobalInventoryResponse';
export * from './product/V202309/UpdateInventoryRequestBody';
export * from './product/V202309/UpdateInventoryRequestBodySkus';
export * from './product/V202309/UpdateInventoryRequestBodySkusInventory';
export * from './product/V202309/UpdateInventoryResponse';
export * from './product/V202309/UpdateInventoryResponseData';
export * from './product/V202309/UpdateInventoryResponseDataErrors';
export * from './product/V202309/UpdateInventoryResponseDataErrorsDetail';
export * from './product/V202309/UpdateInventoryResponseDataErrorsDetailExtraErrors';
export * from './product/V202309/UpdatePriceRequestBody';
export * from './product/V202309/UpdatePriceRequestBodySkus';
export * from './product/V202309/UpdatePriceRequestBodySkusExternalListPrices';
export * from './product/V202309/UpdatePriceRequestBodySkusListPrice';
export * from './product/V202309/UpdatePriceRequestBodySkusPrice';
export * from './product/V202309/UpdatePriceResponse';
export * from './product/V202309/UploadProductFileResponse';
export * from './product/V202309/UploadProductFileResponseData';
export * from './product/V202309/UploadProductImageResponse';
export * from './product/V202309/UploadProductImageResponseData';
export * from './product/V202312/CheckListingPrerequisitesResponse';
export * from './product/V202312/CheckListingPrerequisitesResponseData';
export * from './product/V202312/CheckListingPrerequisitesResponseDataCheckResults';
export * from './product/V202312/SearchGlobalProductsRequestBody';
export * from './product/V202312/SearchGlobalProductsResponse';
export * from './product/V202312/SearchGlobalProductsResponseData';
export * from './product/V202312/SearchGlobalProductsResponseDataGlobalProducts';
export * from './product/V202312/SearchGlobalProductsResponseDataGlobalProductsSkus';
export * from './product/V202312/SearchProductsRequestBody';
export * from './product/V202312/SearchProductsResponse';
export * from './product/V202312/SearchProductsResponseData';
export * from './product/V202312/SearchProductsResponseDataProducts';
export * from './product/V202312/SearchProductsResponseDataProductsAudit';
export * from './product/V202312/SearchProductsResponseDataProductsIntegratedPlatformStatuses';
export * from './product/V202312/SearchProductsResponseDataProductsRecommendedCategories';
export * from './product/V202312/SearchProductsResponseDataProductsSkus';
export * from './product/V202312/SearchProductsResponseDataProductsSkusExternalListPrices';
export * from './product/V202312/SearchProductsResponseDataProductsSkusInventory';
export * from './product/V202312/SearchProductsResponseDataProductsSkusListPrice';
export * from './product/V202312/SearchProductsResponseDataProductsSkusPrice';
export * from './product/V202401/ListingSchemasResponse';
export * from './product/V202401/ListingSchemasResponseData';
export * from './product/V202401/ListingSchemasResponseDataErrors';
export * from './product/V202401/ListingSchemasResponseDataErrorsDetail';
export * from './product/V202401/ListingSchemasResponseDataListingSchemas';
export * from './product/V202401/ListingSchemasResponseDataListingSchemasFileds';
export * from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsComplexValues';
export * from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsComplexValuesOptions';
export * from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsComplexValuesRules';
export * from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsOptions';
export * from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsRules';
export * from './product/V202404/OptimizedImagesRequestBody';
export * from './product/V202404/OptimizedImagesRequestBodyImages';
export * from './product/V202404/OptimizedImagesResponse';
export * from './product/V202404/OptimizedImagesResponseData';
export * from './product/V202404/OptimizedImagesResponseDataImages';
export * from './product/V202405/GetProductsSEOWordsResponse';
export * from './product/V202405/GetProductsSEOWordsResponseData';
export * from './product/V202405/GetProductsSEOWordsResponseDataProducts';
export * from './product/V202405/GetProductsSEOWordsResponseDataProductsSeoWords';
export * from './product/V202405/GetRecommendedProductTitleAndDescriptionResponse';
export * from './product/V202405/GetRecommendedProductTitleAndDescriptionResponseData';
export * from './product/V202405/GetRecommendedProductTitleAndDescriptionResponseDataProducts';
export * from './product/V202405/GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestions';
export * from './product/V202405/GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestionsItems';
export * from './product/V202405/ProductInformationIssueDiagnosisResponse';
export * from './product/V202405/ProductInformationIssueDiagnosisResponseData';
export * from './product/V202405/ProductInformationIssueDiagnosisResponseDataProducts';
export * from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnoses';
export * from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesDiagnosisResults';
export * from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestion';
export * from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionImages';
export * from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSeoWords';
export * from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSmartTexts';
export * from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsListingQuality';
export * from './product/V202407/CreateCategoryUpgradeTaskResponse';
export * from './product/V202407/ListingSchemasResponse';
export * from './product/V202407/ListingSchemasResponseData';
export * from './product/V202407/ListingSchemasResponseDataErrors';
export * from './product/V202407/ListingSchemasResponseDataErrorsDetail';
export * from './product/V202407/ListingSchemasResponseDataListingSchemas';
export * from './product/V202407/ListingSchemasResponseDataListingSchemasFields';
export * from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsComplexValues';
export * from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsComplexValuesOptions';
export * from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsComplexValuesRules';
export * from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsOptions';
export * from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsRules';
export * from './product/V202407/SearchSizeChartsRequestBody';
export * from './product/V202407/SearchSizeChartsResponse';
export * from './product/V202407/SearchSizeChartsResponseData';
export * from './product/V202407/SearchSizeChartsResponseDataSizeChart';
export * from './product/V202407/SearchSizeChartsResponseDataSizeChartImages';
export * from './product/V202409/CreateManufacturerRequestBody';
export * from './product/V202409/CreateManufacturerRequestBodyPhoneNumber';
export * from './product/V202409/CreateManufacturerResponse';
export * from './product/V202409/CreateManufacturerResponseData';
export * from './product/V202409/CreateResponsiblePersonRequestBody';
export * from './product/V202409/CreateResponsiblePersonRequestBodyAddress';
export * from './product/V202409/CreateResponsiblePersonRequestBodyPhoneNumber';
export * from './product/V202409/CreateResponsiblePersonResponse';
export * from './product/V202409/CreateResponsiblePersonResponseData';
export * from './product/V202409/PartialEditManufacturerRequestBody';
export * from './product/V202409/PartialEditManufacturerRequestBodyPhoneNumber';
export * from './product/V202409/PartialEditManufacturerResponse';
export * from './product/V202409/PartialEditResponsiblePersonRequestBody';
export * from './product/V202409/PartialEditResponsiblePersonRequestBodyAddress';
export * from './product/V202409/PartialEditResponsiblePersonRequestBodyPhoneNumber';
export * from './product/V202409/PartialEditResponsiblePersonResponse';
export * from './product/V202409/SearchManufacturersRequestBody';
export * from './product/V202409/SearchManufacturersResponse';
export * from './product/V202409/SearchManufacturersResponseData';
export * from './product/V202409/SearchManufacturersResponseDataManufacturers';
export * from './product/V202409/SearchManufacturersResponseDataManufacturersPhoneNumber';
export * from './product/V202409/SearchResponsiblePersonsRequestBody';
export * from './product/V202409/SearchResponsiblePersonsResponse';
export * from './product/V202409/SearchResponsiblePersonsResponseData';
export * from './product/V202409/SearchResponsiblePersonsResponseDataResponsiblePersons';
export * from './product/V202409/SearchResponsiblePersonsResponseDataResponsiblePersonsAddress';
export * from './product/V202409/SearchResponsiblePersonsResponseDataResponsiblePersonsPhoneNumber';
export * from './product/V202501/SearchManufacturersRequestBody';
export * from './product/V202501/SearchManufacturersResponse';
export * from './product/V202501/SearchManufacturersResponseData';
export * from './product/V202501/SearchManufacturersResponseDataManufacturers';
export * from './product/V202501/SearchManufacturersResponseDataManufacturersRegionalProfiles';
export * from './product/V202501/SearchManufacturersResponseDataManufacturersRegionalProfilesPhoneNumber';
export * from './product/V202501/SearchResponsiblePersonsRequestBody';
export * from './product/V202501/SearchResponsiblePersonsResponse';
export * from './product/V202501/SearchResponsiblePersonsResponseData';
export * from './product/V202501/SearchResponsiblePersonsResponseDataResponsiblePersons';
export * from './product/V202501/SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfiles';
export * from './product/V202501/SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesAddress';
export * from './product/V202501/SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesPhoneNumber';
export * from './product/V202502/SearchProductsRequestBody';
export * from './product/V202502/SearchProductsResponse';
export * from './product/V202502/SearchProductsResponseData';
export * from './product/V202502/SearchProductsResponseDataProducts';
export * from './product/V202502/SearchProductsResponseDataProductsAudit';
export * from './product/V202502/SearchProductsResponseDataProductsIntegratedPlatformStatuses';
export * from './product/V202502/SearchProductsResponseDataProductsProductFamilies';
export * from './product/V202502/SearchProductsResponseDataProductsProductFamiliesProducts';
export * from './product/V202502/SearchProductsResponseDataProductsRecommendedCategories';
export * from './product/V202502/SearchProductsResponseDataProductsSkus';
export * from './product/V202502/SearchProductsResponseDataProductsSkusExternalListPrices';
export * from './product/V202502/SearchProductsResponseDataProductsSkusInventory';
export * from './product/V202502/SearchProductsResponseDataProductsSkusListPrice';
export * from './product/V202502/SearchProductsResponseDataProductsSkusPreSale';
export * from './product/V202502/SearchProductsResponseDataProductsSkusPreSaleFulfillmentType';
export * from './product/V202502/SearchProductsResponseDataProductsSkusPrice';
export * from './product/V202505/CreateImageTranslationTasksRequestBody';
export * from './product/V202505/CreateImageTranslationTasksRequestBodyImages';
export * from './product/V202505/CreateImageTranslationTasksResponse';
export * from './product/V202505/CreateImageTranslationTasksResponseData';
export * from './product/V202505/CreateImageTranslationTasksResponseDataTranslationTasks';
export * from './product/V202506/GetImageTranslationTasksResponse';
export * from './product/V202506/GetImageTranslationTasksResponseData';
export * from './product/V202506/GetImageTranslationTasksResponseDataTranslationTasks';
export * from './product/V202506/GetImageTranslationTasksResponseDataTranslationTasksOriginalImage';
export * from './product/V202506/GetImageTranslationTasksResponseDataTranslationTasksTranslatedImage';
export * from './promotion/V202309/CreateActivityRequestBody';
export * from './promotion/V202309/CreateActivityRequestBodyDiscount';
export * from './promotion/V202309/CreateActivityRequestBodyDiscountBmsmDiscount';
export * from './promotion/V202309/CreateActivityRequestBodyDiscountBmsmDiscountDetails';
export * from './promotion/V202309/CreateActivityRequestBodyDiscountGiftDiscount';
export * from './promotion/V202309/CreateActivityRequestBodyDiscountGiftDiscountGiftInfos';
export * from './promotion/V202309/CreateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails';
export * from './promotion/V202309/CreateActivityRequestBodyDiscountShippingDiscount';
export * from './promotion/V202309/CreateActivityRequestBodyDiscountShippingDiscountAreaScope';
export * from './promotion/V202309/CreateActivityRequestBodyParticipationLimit';
export * from './promotion/V202309/CreateActivityResponse';
export * from './promotion/V202309/CreateActivityResponseData';
export * from './promotion/V202309/DeactivateActivityResponse';
export * from './promotion/V202309/DeactivateActivityResponseData';
export * from './promotion/V202309/GetActivityResponse';
export * from './promotion/V202309/GetActivityResponseData';
export * from './promotion/V202309/GetActivityResponseDataDiscount';
export * from './promotion/V202309/GetActivityResponseDataDiscountBmsmDiscount';
export * from './promotion/V202309/GetActivityResponseDataDiscountBmsmDiscountDetails';
export * from './promotion/V202309/GetActivityResponseDataDiscountGiftDiscount';
export * from './promotion/V202309/GetActivityResponseDataDiscountGiftDiscountGiftInfos';
export * from './promotion/V202309/GetActivityResponseDataDiscountGiftDiscountGiftInfosGiftDetails';
export * from './promotion/V202309/GetActivityResponseDataDiscountShippingDiscount';
export * from './promotion/V202309/GetActivityResponseDataDiscountShippingDiscountAreaScope';
export * from './promotion/V202309/GetActivityResponseDataParticipationLimit';
export * from './promotion/V202309/GetActivityResponseDataProducts';
export * from './promotion/V202309/GetActivityResponseDataProductsActivityPrice';
export * from './promotion/V202309/GetActivityResponseDataProductsSkus';
export * from './promotion/V202309/GetActivityResponseDataProductsSkusActivityPrice';
export * from './promotion/V202309/RemoveActivityProductRequestBody';
export * from './promotion/V202309/RemoveActivityProductResponse';
export * from './promotion/V202309/RemoveActivityProductResponseData';
export * from './promotion/V202309/SearchActivitiesRequestBody';
export * from './promotion/V202309/SearchActivitiesResponse';
export * from './promotion/V202309/SearchActivitiesResponseData';
export * from './promotion/V202309/SearchActivitiesResponseDataActivities';
export * from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscount';
export * from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountBmsmDiscount';
export * from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountBmsmDiscountDetails';
export * from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountGiftDiscount';
export * from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfos';
export * from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfosGiftDetails';
export * from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountShippingDiscount';
export * from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountShippingDiscountAreaScope';
export * from './promotion/V202309/SearchActivitiesResponseDataActivitiesParticipationLimit';
export * from './promotion/V202309/UpdateActivityProductRequestBody';
export * from './promotion/V202309/UpdateActivityProductRequestBodyProducts';
export * from './promotion/V202309/UpdateActivityProductRequestBodyProductsSkus';
export * from './promotion/V202309/UpdateActivityProductResponse';
export * from './promotion/V202309/UpdateActivityProductResponseData';
export * from './promotion/V202309/UpdateActivityRequestBody';
export * from './promotion/V202309/UpdateActivityRequestBodyDiscount';
export * from './promotion/V202309/UpdateActivityRequestBodyDiscountBmsmDiscount';
export * from './promotion/V202309/UpdateActivityRequestBodyDiscountBmsmDiscountDetails';
export * from './promotion/V202309/UpdateActivityRequestBodyDiscountGiftDiscount';
export * from './promotion/V202309/UpdateActivityRequestBodyDiscountGiftDiscountGiftInfos';
export * from './promotion/V202309/UpdateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails';
export * from './promotion/V202309/UpdateActivityRequestBodyDiscountShippingDiscount';
export * from './promotion/V202309/UpdateActivityRequestBodyDiscountShippingDiscountAreaScope';
export * from './promotion/V202309/UpdateActivityRequestBodyParticipationLimit';
export * from './promotion/V202309/UpdateActivityResponse';
export * from './promotion/V202309/UpdateActivityResponseData';
export * from './promotion/V202406/GetCouponResponse';
export * from './promotion/V202406/GetCouponResponseData';
export * from './promotion/V202406/GetCouponResponseDataCoupon';
export * from './promotion/V202406/GetCouponResponseDataCouponClaimDuration';
export * from './promotion/V202406/GetCouponResponseDataCouponDiscount';
export * from './promotion/V202406/GetCouponResponseDataCouponDiscountMaxDiscount';
export * from './promotion/V202406/GetCouponResponseDataCouponDiscountReductionAmount';
export * from './promotion/V202406/GetCouponResponseDataCouponLiveTasks';
export * from './promotion/V202406/GetCouponResponseDataCouponRedemptionDuration';
export * from './promotion/V202406/GetCouponResponseDataCouponThreshold';
export * from './promotion/V202406/GetCouponResponseDataCouponThresholdMinSpend';
export * from './promotion/V202406/GetCouponResponseDataCouponUsageLimits';
export * from './promotion/V202406/GetCouponResponseDataCouponUsageStats';
export * from './promotion/V202406/SearchCouponsRequestBody';
export * from './promotion/V202406/SearchCouponsResponse';
export * from './promotion/V202406/SearchCouponsResponseData';
export * from './promotion/V202406/SearchCouponsResponseDataCoupons';
export * from './promotion/V202406/SearchCouponsResponseDataCouponsClaimDuration';
export * from './promotion/V202406/SearchCouponsResponseDataCouponsDiscount';
export * from './promotion/V202406/SearchCouponsResponseDataCouponsDiscountMaxDiscount';
export * from './promotion/V202406/SearchCouponsResponseDataCouponsDiscountReductionAmount';
export * from './promotion/V202406/SearchCouponsResponseDataCouponsRedemptionDuration';
export * from './promotion/V202406/SearchCouponsResponseDataCouponsThreshold';
export * from './promotion/V202406/SearchCouponsResponseDataCouponsThresholdMinSpend';
export * from './promotion/V202406/SearchCouponsResponseDataCouponsUsageLimits';
export * from './returnRefund/V202309/ApproveCancellationResponse';
export * from './returnRefund/V202309/ApproveReturnRequestBody';
export * from './returnRefund/V202309/ApproveReturnRequestBodyPartialRefund';
export * from './returnRefund/V202309/ApproveReturnResponse';
export * from './returnRefund/V202309/CalculateRefundRequestBody';
export * from './returnRefund/V202309/CalculateRefundRequestBodySkus';
export * from './returnRefund/V202309/CalculateRefundResponse';
export * from './returnRefund/V202309/CalculateRefundResponseData';
export * from './returnRefund/V202309/CalculateRefundResponseDataOrderRefundAmount';
export * from './returnRefund/V202309/CancelOrderRequestBody';
export * from './returnRefund/V202309/CancelOrderRequestBodySkus';
export * from './returnRefund/V202309/CancelOrderResponse';
export * from './returnRefund/V202309/CancelOrderResponseData';
export * from './returnRefund/V202309/CreateReturnRequestBody';
export * from './returnRefund/V202309/CreateReturnRequestBodySkus';
export * from './returnRefund/V202309/CreateReturnResponse';
export * from './returnRefund/V202309/CreateReturnResponseData';
export * from './returnRefund/V202309/GetAftersaleEligibilityResponse';
export * from './returnRefund/V202309/GetAftersaleEligibilityResponseData';
export * from './returnRefund/V202309/GetAftersaleEligibilityResponseDataSkuEligibility';
export * from './returnRefund/V202309/GetAftersaleEligibilityResponseDataSkuEligibilityLineItemEligibility';
export * from './returnRefund/V202309/GetRejectReasonsResponse';
export * from './returnRefund/V202309/GetRejectReasonsResponseData';
export * from './returnRefund/V202309/GetRejectReasonsResponseDataReasons';
export * from './returnRefund/V202309/GetReturnRecordsResponse';
export * from './returnRefund/V202309/GetReturnRecordsResponseData';
export * from './returnRefund/V202309/GetReturnRecordsResponseDataRecords';
export * from './returnRefund/V202309/GetReturnRecordsResponseDataRecordsImages';
export * from './returnRefund/V202309/GetReturnRecordsResponseDataRecordsVideos';
export * from './returnRefund/V202309/RejectCancellationRequestBody';
export * from './returnRefund/V202309/RejectCancellationRequestBodyImages';
export * from './returnRefund/V202309/RejectCancellationResponse';
export * from './returnRefund/V202309/RejectReturnRequestBody';
export * from './returnRefund/V202309/RejectReturnRequestBodyImages';
export * from './returnRefund/V202309/RejectReturnResponse';
export * from './returnRefund/V202309/SearchCancellationsRequestBody';
export * from './returnRefund/V202309/SearchCancellationsResponse';
export * from './returnRefund/V202309/SearchCancellationsResponseData';
export * from './returnRefund/V202309/SearchCancellationsResponseDataCancellations';
export * from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsCancelLineItems';
export * from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsCancelLineItemsProductImage';
export * from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsCancelLineItemsRefundAmount';
export * from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsRefundAmount';
export * from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsSellerNextActionResponse';
export * from './returnRefund/V202309/SearchReturnsRequestBody';
export * from './returnRefund/V202309/SearchReturnsResponse';
export * from './returnRefund/V202309/SearchReturnsResponseData';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrders';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersDiscountAmount';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersPartialRefund';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersRefundAmount';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersReturnLineItems';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersReturnLineItemsProductImage';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersReturnLineItemsRefundAmount';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersReturnWarehouseAddress';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersSellerNextActionResponse';
export * from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersShippingFeeAmount';
export * from './seller/V202309/GetActiveShopsResponse';
export * from './seller/V202309/GetActiveShopsResponseData';
export * from './seller/V202309/GetActiveShopsResponseDataShops';
export * from './seller/V202309/GetSellerPermissionsResponse';
export * from './seller/V202309/GetSellerPermissionsResponseData';
export * from './supplyChain/V202309/ConfirmPackageShipmentRequestBody';
export * from './supplyChain/V202309/ConfirmPackageShipmentRequestBodyPackages';
export * from './supplyChain/V202309/ConfirmPackageShipmentRequestBodyPackagesDimension';
export * from './supplyChain/V202309/ConfirmPackageShipmentRequestBodyPackagesSkus';
export * from './supplyChain/V202309/ConfirmPackageShipmentRequestBodyPackagesWeight';
export * from './supplyChain/V202309/ConfirmPackageShipmentResponse';
export * from './supplyChain/V202309/ConfirmPackageShipmentResponseData';
export * from './supplyChain/V202309/ConfirmPackageShipmentResponseDataErrors';
export * from './supplyChain/V202309/ConfirmPackageShipmentResponseDataErrorsDetail';

import * as fs from 'fs';

export interface RequestDetailedFile {
    value: Buffer;
    options?: {
        filename?: string;
        contentType?: string;
    }
}

export type RequestFile = string | Buffer | fs.ReadStream | RequestDetailedFile;


import { Authorization202309GetAuthorizedShopsResponse } from './authorization/V202309/GetAuthorizedShopsResponse';
import { Authorization202309GetAuthorizedShopsResponseData } from './authorization/V202309/GetAuthorizedShopsResponseData';
import { Authorization202309GetAuthorizedShopsResponseDataShops } from './authorization/V202309/GetAuthorizedShopsResponseDataShops';
import { Authorization202312GetWidgetTokenResponse } from './authorization/V202312/GetWidgetTokenResponse';
import { Authorization202312GetWidgetTokenResponseData } from './authorization/V202312/GetWidgetTokenResponseData';
import { Authorization202312GetWidgetTokenResponseDataWidgetToken } from './authorization/V202312/GetWidgetTokenResponseDataWidgetToken';
import { Authorization202401GetWidgetTokenResponse } from './authorization/V202401/GetWidgetTokenResponse';
import { Authorization202401GetWidgetTokenResponseData } from './authorization/V202401/GetWidgetTokenResponseData';
import { Authorization202401GetWidgetTokenResponseDataWidgetToken } from './authorization/V202401/GetWidgetTokenResponseDataWidgetToken';
import { Authorization202403DeauthorizeShopResponse } from './authorization/V202403/DeauthorizeShopResponse';
import { CustomerService202309CreateConversationRequestBody } from './customerService/V202309/CreateConversationRequestBody';
import { CustomerService202309CreateConversationResponse } from './customerService/V202309/CreateConversationResponse';
import { CustomerService202309CreateConversationResponseData } from './customerService/V202309/CreateConversationResponseData';
import { CustomerService202309GetAgentSettingsResponse } from './customerService/V202309/GetAgentSettingsResponse';
import { CustomerService202309GetAgentSettingsResponseData } from './customerService/V202309/GetAgentSettingsResponseData';
import { CustomerService202309GetConversationMessagesResponse } from './customerService/V202309/GetConversationMessagesResponse';
import { CustomerService202309GetConversationMessagesResponseData } from './customerService/V202309/GetConversationMessagesResponseData';
import { CustomerService202309GetConversationMessagesResponseDataMessages } from './customerService/V202309/GetConversationMessagesResponseDataMessages';
import { CustomerService202309GetConversationMessagesResponseDataMessagesSender } from './customerService/V202309/GetConversationMessagesResponseDataMessagesSender';
import { CustomerService202309GetConversationsResponse } from './customerService/V202309/GetConversationsResponse';
import { CustomerService202309GetConversationsResponseData } from './customerService/V202309/GetConversationsResponseData';
import { CustomerService202309GetConversationsResponseDataConversations } from './customerService/V202309/GetConversationsResponseDataConversations';
import { CustomerService202309GetConversationsResponseDataConversationsLatestMessage } from './customerService/V202309/GetConversationsResponseDataConversationsLatestMessage';
import { CustomerService202309GetConversationsResponseDataConversationsLatestMessageSender } from './customerService/V202309/GetConversationsResponseDataConversationsLatestMessageSender';
import { CustomerService202309GetConversationsResponseDataConversationsParticipants } from './customerService/V202309/GetConversationsResponseDataConversationsParticipants';
import { CustomerService202309ReadMessageResponse } from './customerService/V202309/ReadMessageResponse';
import { CustomerService202309SendMessageRequestBody } from './customerService/V202309/SendMessageRequestBody';
import { CustomerService202309SendMessageResponse } from './customerService/V202309/SendMessageResponse';
import { CustomerService202309SendMessageResponseData } from './customerService/V202309/SendMessageResponseData';
import { CustomerService202309UpdateAgentSettingsRequestBody } from './customerService/V202309/UpdateAgentSettingsRequestBody';
import { CustomerService202309UpdateAgentSettingsResponse } from './customerService/V202309/UpdateAgentSettingsResponse';
import { CustomerService202309UploadBuyerMessagesImageResponse } from './customerService/V202309/UploadBuyerMessagesImageResponse';
import { CustomerService202309UploadBuyerMessagesImageResponseData } from './customerService/V202309/UploadBuyerMessagesImageResponseData';
import { CustomerService202407GetCustomerServicePerformanceResponse } from './customerService/V202407/GetCustomerServicePerformanceResponse';
import { CustomerService202407GetCustomerServicePerformanceResponseData } from './customerService/V202407/GetCustomerServicePerformanceResponseData';
import { CustomerService202407GetCustomerServicePerformanceResponseDataPerformance } from './customerService/V202407/GetCustomerServicePerformanceResponseDataPerformance';
import { DataReconciliation202309OrderStatusDataExchangeRequestBody } from './dataReconciliation/V202309/OrderStatusDataExchangeRequestBody';
import { DataReconciliation202309OrderStatusDataExchangeRequestBodyOrders } from './dataReconciliation/V202309/OrderStatusDataExchangeRequestBodyOrders';
import { DataReconciliation202309OrderStatusDataExchangeRequestBodyOrdersPackages } from './dataReconciliation/V202309/OrderStatusDataExchangeRequestBodyOrdersPackages';
import { DataReconciliation202309OrderStatusDataExchangeResponse } from './dataReconciliation/V202309/OrderStatusDataExchangeResponse';
import { DataReconciliation202309OrderStatusDataExchangeResponseData } from './dataReconciliation/V202309/OrderStatusDataExchangeResponseData';
import { DataReconciliation202309OrderStatusDataExchangeResponseDataErrors } from './dataReconciliation/V202309/OrderStatusDataExchangeResponseDataErrors';
import { DataReconciliation202309OrderStatusDataExchangeResponseDataErrorsDetail } from './dataReconciliation/V202309/OrderStatusDataExchangeResponseDataErrorsDetail';
import { DataReconciliation202309OrderStatusDataExchangeResponseDataErrorsDetailExtraErrors } from './dataReconciliation/V202309/OrderStatusDataExchangeResponseDataErrorsDetailExtraErrors';
import { DataReconciliation202310QualityFactoryOrderDataImportAPIRequestBody } from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIRequestBody';
import { DataReconciliation202310QualityFactoryOrderDataImportAPIRequestBodyOrders } from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIRequestBodyOrders';
import { DataReconciliation202310QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages } from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages';
import { DataReconciliation202310QualityFactoryOrderDataImportAPIResponse } from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponse';
import { DataReconciliation202310QualityFactoryOrderDataImportAPIResponseData } from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponseData';
import { DataReconciliation202310QualityFactoryOrderDataImportAPIResponseDataErrors } from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponseDataErrors';
import { DataReconciliation202310QualityFactoryOrderDataImportAPIResponseDataErrorsDetail } from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponseDataErrorsDetail';
import { DataReconciliation202310QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors } from './dataReconciliation/V202310/QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors';
import { DataReconciliation202401QualityFactoryOrderDataImportAPIRequestBody } from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIRequestBody';
import { DataReconciliation202401QualityFactoryOrderDataImportAPIRequestBodyOrders } from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIRequestBodyOrders';
import { DataReconciliation202401QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages } from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages';
import { DataReconciliation202401QualityFactoryOrderDataImportAPIResponse } from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponse';
import { DataReconciliation202401QualityFactoryOrderDataImportAPIResponseData } from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponseData';
import { DataReconciliation202401QualityFactoryOrderDataImportAPIResponseDataErrors } from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponseDataErrors';
import { DataReconciliation202401QualityFactoryOrderDataImportAPIResponseDataErrorsDetail } from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponseDataErrorsDetail';
import { DataReconciliation202401QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors } from './dataReconciliation/V202401/QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors';
import { Event202309DeleteShopWebhookRequestBody } from './event/V202309/DeleteShopWebhookRequestBody';
import { Event202309DeleteShopWebhookResponse } from './event/V202309/DeleteShopWebhookResponse';
import { Event202309GetShopWebhooksResponse } from './event/V202309/GetShopWebhooksResponse';
import { Event202309GetShopWebhooksResponseData } from './event/V202309/GetShopWebhooksResponseData';
import { Event202309GetShopWebhooksResponseDataWebhooks } from './event/V202309/GetShopWebhooksResponseDataWebhooks';
import { Event202309UpdateShopWebhookRequestBody } from './event/V202309/UpdateShopWebhookRequestBody';
import { Event202309UpdateShopWebhookResponse } from './event/V202309/UpdateShopWebhookResponse';
import { Finance202309GetPaymentsResponse } from './finance/V202309/GetPaymentsResponse';
import { Finance202309GetPaymentsResponseData } from './finance/V202309/GetPaymentsResponseData';
import { Finance202309GetPaymentsResponseDataPayments } from './finance/V202309/GetPaymentsResponseDataPayments';
import { Finance202309GetPaymentsResponseDataPaymentsAmount } from './finance/V202309/GetPaymentsResponseDataPaymentsAmount';
import { Finance202309GetPaymentsResponseDataPaymentsPaymentAmountBeforeExchange } from './finance/V202309/GetPaymentsResponseDataPaymentsPaymentAmountBeforeExchange';
import { Finance202309GetPaymentsResponseDataPaymentsReserveAmount } from './finance/V202309/GetPaymentsResponseDataPaymentsReserveAmount';
import { Finance202309GetPaymentsResponseDataPaymentsSettlementAmount } from './finance/V202309/GetPaymentsResponseDataPaymentsSettlementAmount';
import { Finance202309GetStatementsResponse } from './finance/V202309/GetStatementsResponse';
import { Finance202309GetStatementsResponseData } from './finance/V202309/GetStatementsResponseData';
import { Finance202309GetStatementsResponseDataStatements } from './finance/V202309/GetStatementsResponseDataStatements';
import { Finance202309GetTransactionsbyOrderResponse } from './finance/V202309/GetTransactionsbyOrderResponse';
import { Finance202309GetTransactionsbyOrderResponseData } from './finance/V202309/GetTransactionsbyOrderResponseData';
import { Finance202309GetTransactionsbyOrderResponseDataStatementTransactions } from './finance/V202309/GetTransactionsbyOrderResponseDataStatementTransactions';
import { Finance202309GetTransactionsbyOrderResponseDataStatementTransactionsSkuStatementTransactions } from './finance/V202309/GetTransactionsbyOrderResponseDataStatementTransactionsSkuStatementTransactions';
import { Finance202309GetTransactionsbyStatementResponse } from './finance/V202309/GetTransactionsbyStatementResponse';
import { Finance202309GetTransactionsbyStatementResponseData } from './finance/V202309/GetTransactionsbyStatementResponseData';
import { Finance202309GetTransactionsbyStatementResponseDataStatementTransactions } from './finance/V202309/GetTransactionsbyStatementResponseDataStatementTransactions';
import { Finance202309GetWithdrawalsResponse } from './finance/V202309/GetWithdrawalsResponse';
import { Finance202309GetWithdrawalsResponseData } from './finance/V202309/GetWithdrawalsResponseData';
import { Finance202309GetWithdrawalsResponseDataWithdrawals } from './finance/V202309/GetWithdrawalsResponseDataWithdrawals';
import { Finance202501GetTransactionsbyOrderResponse } from './finance/V202501/GetTransactionsbyOrderResponse';
import { Finance202501GetTransactionsbyOrderResponseData } from './finance/V202501/GetTransactionsbyOrderResponseData';
import { Finance202501GetTransactionsbyOrderResponseDataSkuTransactions } from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactions';
import { Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdown } from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdown';
import { Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownFee } from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownFee';
import { Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownTax } from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownTax';
import { Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsRevenueBreakdown } from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsRevenueBreakdown';
import { Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdown } from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdown';
import { Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdownSupplementaryComponent } from './finance/V202501/GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdownSupplementaryComponent';
import { Finance202501GetTransactionsbyStatementResponse } from './finance/V202501/GetTransactionsbyStatementResponse';
import { Finance202501GetTransactionsbyStatementResponseData } from './finance/V202501/GetTransactionsbyStatementResponseData';
import { Finance202501GetTransactionsbyStatementResponseDataTotalSettlementBreakdown } from './finance/V202501/GetTransactionsbyStatementResponseDataTotalSettlementBreakdown';
import { Finance202501GetTransactionsbyStatementResponseDataTransactions } from './finance/V202501/GetTransactionsbyStatementResponseDataTransactions';
import { Finance202501GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdown } from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdown';
import { Finance202501GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownFee } from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownFee';
import { Finance202501GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownTax } from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownTax';
import { Finance202501GetTransactionsbyStatementResponseDataTransactionsRevenueBreakdown } from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsRevenueBreakdown';
import { Finance202501GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdown } from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdown';
import { Finance202501GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdownSupplementaryComponent } from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdownSupplementaryComponent';
import { Finance202501GetTransactionsbyStatementResponseDataTransactionsSupplementaryComponent } from './finance/V202501/GetTransactionsbyStatementResponseDataTransactionsSupplementaryComponent';
import { Finance202506GetSellerunsettledtransactionResponse } from './finance/V202506/GetSellerunsettledtransactionResponse';
import { Finance202506GetSellerunsettledtransactionResponseData } from './finance/V202506/GetSellerunsettledtransactionResponseData';
import { Finance202506GetSellerunsettledtransactionResponseDataTransactions } from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactions';
import { Finance202506GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdown } from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdown';
import { Finance202506GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownFee } from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownFee';
import { Finance202506GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownTax } from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownTax';
import { Finance202506GetSellerunsettledtransactionResponseDataTransactionsRevenueBreakdown } from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsRevenueBreakdown';
import { Finance202506GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdown } from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdown';
import { Finance202506GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdownSupplementaryComponent } from './finance/V202506/GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdownSupplementaryComponent';
import { Fulfillment202309BatchShipPackagesRequestBody } from './fulfillment/V202309/BatchShipPackagesRequestBody';
import { Fulfillment202309BatchShipPackagesRequestBodyPackages } from './fulfillment/V202309/BatchShipPackagesRequestBodyPackages';
import { Fulfillment202309BatchShipPackagesRequestBodyPackagesPickupSlot } from './fulfillment/V202309/BatchShipPackagesRequestBodyPackagesPickupSlot';
import { Fulfillment202309BatchShipPackagesRequestBodyPackagesSelfShipment } from './fulfillment/V202309/BatchShipPackagesRequestBodyPackagesSelfShipment';
import { Fulfillment202309BatchShipPackagesResponse } from './fulfillment/V202309/BatchShipPackagesResponse';
import { Fulfillment202309BatchShipPackagesResponseData } from './fulfillment/V202309/BatchShipPackagesResponseData';
import { Fulfillment202309BatchShipPackagesResponseDataErrors } from './fulfillment/V202309/BatchShipPackagesResponseDataErrors';
import { Fulfillment202309BatchShipPackagesResponseDataErrorsDetail } from './fulfillment/V202309/BatchShipPackagesResponseDataErrorsDetail';
import { Fulfillment202309CombinePackageRequestBody } from './fulfillment/V202309/CombinePackageRequestBody';
import { Fulfillment202309CombinePackageRequestBodyCombinablePackages } from './fulfillment/V202309/CombinePackageRequestBodyCombinablePackages';
import { Fulfillment202309CombinePackageResponse } from './fulfillment/V202309/CombinePackageResponse';
import { Fulfillment202309CombinePackageResponseData } from './fulfillment/V202309/CombinePackageResponseData';
import { Fulfillment202309CombinePackageResponseDataErrors } from './fulfillment/V202309/CombinePackageResponseDataErrors';
import { Fulfillment202309CombinePackageResponseDataErrorsDetail } from './fulfillment/V202309/CombinePackageResponseDataErrorsDetail';
import { Fulfillment202309CombinePackageResponseDataPackages } from './fulfillment/V202309/CombinePackageResponseDataPackages';
import { Fulfillment202309CreatePackagesRequestBody } from './fulfillment/V202309/CreatePackagesRequestBody';
import { Fulfillment202309CreatePackagesRequestBodyDimension } from './fulfillment/V202309/CreatePackagesRequestBodyDimension';
import { Fulfillment202309CreatePackagesRequestBodyWeight } from './fulfillment/V202309/CreatePackagesRequestBodyWeight';
import { Fulfillment202309CreatePackagesResponse } from './fulfillment/V202309/CreatePackagesResponse';
import { Fulfillment202309CreatePackagesResponseData } from './fulfillment/V202309/CreatePackagesResponseData';
import { Fulfillment202309CreatePackagesResponseDataDimension } from './fulfillment/V202309/CreatePackagesResponseDataDimension';
import { Fulfillment202309CreatePackagesResponseDataShippingServiceInfo } from './fulfillment/V202309/CreatePackagesResponseDataShippingServiceInfo';
import { Fulfillment202309CreatePackagesResponseDataWeight } from './fulfillment/V202309/CreatePackagesResponseDataWeight';
import { Fulfillment202309FulfillmentUploadDeliveryFileResponse } from './fulfillment/V202309/FulfillmentUploadDeliveryFileResponse';
import { Fulfillment202309FulfillmentUploadDeliveryFileResponseData } from './fulfillment/V202309/FulfillmentUploadDeliveryFileResponseData';
import { Fulfillment202309FulfillmentUploadDeliveryImageResponse } from './fulfillment/V202309/FulfillmentUploadDeliveryImageResponse';
import { Fulfillment202309FulfillmentUploadDeliveryImageResponseData } from './fulfillment/V202309/FulfillmentUploadDeliveryImageResponseData';
import { Fulfillment202309GetEligibleShippingServiceRequestBody } from './fulfillment/V202309/GetEligibleShippingServiceRequestBody';
import { Fulfillment202309GetEligibleShippingServiceRequestBodyDimension } from './fulfillment/V202309/GetEligibleShippingServiceRequestBodyDimension';
import { Fulfillment202309GetEligibleShippingServiceRequestBodyWeight } from './fulfillment/V202309/GetEligibleShippingServiceRequestBodyWeight';
import { Fulfillment202309GetEligibleShippingServiceResponse } from './fulfillment/V202309/GetEligibleShippingServiceResponse';
import { Fulfillment202309GetEligibleShippingServiceResponseData } from './fulfillment/V202309/GetEligibleShippingServiceResponseData';
import { Fulfillment202309GetEligibleShippingServiceResponseDataDimension } from './fulfillment/V202309/GetEligibleShippingServiceResponseDataDimension';
import { Fulfillment202309GetEligibleShippingServiceResponseDataShippingServices } from './fulfillment/V202309/GetEligibleShippingServiceResponseDataShippingServices';
import { Fulfillment202309GetEligibleShippingServiceResponseDataWeight } from './fulfillment/V202309/GetEligibleShippingServiceResponseDataWeight';
import { Fulfillment202309GetHandoverTimeslotsResponse } from './fulfillment/V202309/GetHandoverTimeslotsResponse';
import { Fulfillment202309GetHandoverTimeslotsResponseData } from './fulfillment/V202309/GetHandoverTimeslotsResponseData';
import { Fulfillment202309GetHandoverTimeslotsResponseDataPickupSlots } from './fulfillment/V202309/GetHandoverTimeslotsResponseDataPickupSlots';
import { Fulfillment202309GetOrderSplitAttributesResponse } from './fulfillment/V202309/GetOrderSplitAttributesResponse';
import { Fulfillment202309GetOrderSplitAttributesResponseData } from './fulfillment/V202309/GetOrderSplitAttributesResponseData';
import { Fulfillment202309GetOrderSplitAttributesResponseDataSplitAttributes } from './fulfillment/V202309/GetOrderSplitAttributesResponseDataSplitAttributes';
import { Fulfillment202309GetOrderSplitAttributesResponseDataSplitAttributesMustSplitReasons } from './fulfillment/V202309/GetOrderSplitAttributesResponseDataSplitAttributesMustSplitReasons';
import { Fulfillment202309GetPackageDetailResponse } from './fulfillment/V202309/GetPackageDetailResponse';
import { Fulfillment202309GetPackageDetailResponseData } from './fulfillment/V202309/GetPackageDetailResponseData';
import { Fulfillment202309GetPackageDetailResponseDataDimension } from './fulfillment/V202309/GetPackageDetailResponseDataDimension';
import { Fulfillment202309GetPackageDetailResponseDataInsurance } from './fulfillment/V202309/GetPackageDetailResponseDataInsurance';
import { Fulfillment202309GetPackageDetailResponseDataOrders } from './fulfillment/V202309/GetPackageDetailResponseDataOrders';
import { Fulfillment202309GetPackageDetailResponseDataOrdersSkus } from './fulfillment/V202309/GetPackageDetailResponseDataOrdersSkus';
import { Fulfillment202309GetPackageDetailResponseDataPickupSlot } from './fulfillment/V202309/GetPackageDetailResponseDataPickupSlot';
import { Fulfillment202309GetPackageDetailResponseDataRecipientAddress } from './fulfillment/V202309/GetPackageDetailResponseDataRecipientAddress';
import { Fulfillment202309GetPackageDetailResponseDataSenderAddress } from './fulfillment/V202309/GetPackageDetailResponseDataSenderAddress';
import { Fulfillment202309GetPackageDetailResponseDataWeight } from './fulfillment/V202309/GetPackageDetailResponseDataWeight';
import { Fulfillment202309GetPackageHandoverTimeSlotsResponse } from './fulfillment/V202309/GetPackageHandoverTimeSlotsResponse';
import { Fulfillment202309GetPackageHandoverTimeSlotsResponseData } from './fulfillment/V202309/GetPackageHandoverTimeSlotsResponseData';
import { Fulfillment202309GetPackageHandoverTimeSlotsResponseDataPickupSlots } from './fulfillment/V202309/GetPackageHandoverTimeSlotsResponseDataPickupSlots';
import { Fulfillment202309GetPackageShippingDocumentResponse } from './fulfillment/V202309/GetPackageShippingDocumentResponse';
import { Fulfillment202309GetPackageShippingDocumentResponseData } from './fulfillment/V202309/GetPackageShippingDocumentResponseData';
import { Fulfillment202309GetTrackingResponse } from './fulfillment/V202309/GetTrackingResponse';
import { Fulfillment202309GetTrackingResponseData } from './fulfillment/V202309/GetTrackingResponseData';
import { Fulfillment202309GetTrackingResponseDataTracking } from './fulfillment/V202309/GetTrackingResponseDataTracking';
import { Fulfillment202309MarkPackageAsShippedRequestBody } from './fulfillment/V202309/MarkPackageAsShippedRequestBody';
import { Fulfillment202309MarkPackageAsShippedResponse } from './fulfillment/V202309/MarkPackageAsShippedResponse';
import { Fulfillment202309MarkPackageAsShippedResponseData } from './fulfillment/V202309/MarkPackageAsShippedResponseData';
import { Fulfillment202309MarkPackageAsShippedResponseDataWarning } from './fulfillment/V202309/MarkPackageAsShippedResponseDataWarning';
import { Fulfillment202309SchedulePackageHandoverRequestBody } from './fulfillment/V202309/SchedulePackageHandoverRequestBody';
import { Fulfillment202309SchedulePackageHandoverRequestBodyPickupSlot } from './fulfillment/V202309/SchedulePackageHandoverRequestBodyPickupSlot';
import { Fulfillment202309SchedulePackageHandoverResponse } from './fulfillment/V202309/SchedulePackageHandoverResponse';
import { Fulfillment202309SchedulePackageHandoverResponseData } from './fulfillment/V202309/SchedulePackageHandoverResponseData';
import { Fulfillment202309SchedulePackageHandoverResponseDataDimension } from './fulfillment/V202309/SchedulePackageHandoverResponseDataDimension';
import { Fulfillment202309SchedulePackageHandoverResponseDataWeight } from './fulfillment/V202309/SchedulePackageHandoverResponseDataWeight';
import { Fulfillment202309SearchCombinablePackagesResponse } from './fulfillment/V202309/SearchCombinablePackagesResponse';
import { Fulfillment202309SearchCombinablePackagesResponseData } from './fulfillment/V202309/SearchCombinablePackagesResponseData';
import { Fulfillment202309SearchCombinablePackagesResponseDataCombinablePackages } from './fulfillment/V202309/SearchCombinablePackagesResponseDataCombinablePackages';
import { Fulfillment202309SearchPackageRequestBody } from './fulfillment/V202309/SearchPackageRequestBody';
import { Fulfillment202309SearchPackageResponse } from './fulfillment/V202309/SearchPackageResponse';
import { Fulfillment202309SearchPackageResponseData } from './fulfillment/V202309/SearchPackageResponseData';
import { Fulfillment202309SearchPackageResponseDataPackages } from './fulfillment/V202309/SearchPackageResponseDataPackages';
import { Fulfillment202309SearchPackageResponseDataPackagesOrders } from './fulfillment/V202309/SearchPackageResponseDataPackagesOrders';
import { Fulfillment202309SearchPackageResponseDataPackagesOrdersSkus } from './fulfillment/V202309/SearchPackageResponseDataPackagesOrdersSkus';
import { Fulfillment202309ShipPackageRequestBody } from './fulfillment/V202309/ShipPackageRequestBody';
import { Fulfillment202309ShipPackageRequestBodyPickupSlot } from './fulfillment/V202309/ShipPackageRequestBodyPickupSlot';
import { Fulfillment202309ShipPackageRequestBodySelfShipment } from './fulfillment/V202309/ShipPackageRequestBodySelfShipment';
import { Fulfillment202309ShipPackageResponse } from './fulfillment/V202309/ShipPackageResponse';
import { Fulfillment202309SplitOrdersRequestBody } from './fulfillment/V202309/SplitOrdersRequestBody';
import { Fulfillment202309SplitOrdersRequestBodySplittableGroups } from './fulfillment/V202309/SplitOrdersRequestBodySplittableGroups';
import { Fulfillment202309SplitOrdersResponse } from './fulfillment/V202309/SplitOrdersResponse';
import { Fulfillment202309SplitOrdersResponseData } from './fulfillment/V202309/SplitOrdersResponseData';
import { Fulfillment202309SplitOrdersResponseDataPackages } from './fulfillment/V202309/SplitOrdersResponseDataPackages';
import { Fulfillment202309UncombinePackagesRequestBody } from './fulfillment/V202309/UncombinePackagesRequestBody';
import { Fulfillment202309UncombinePackagesResponse } from './fulfillment/V202309/UncombinePackagesResponse';
import { Fulfillment202309UncombinePackagesResponseData } from './fulfillment/V202309/UncombinePackagesResponseData';
import { Fulfillment202309UncombinePackagesResponseDataPackages } from './fulfillment/V202309/UncombinePackagesResponseDataPackages';
import { Fulfillment202309UpdatePackageDeliveryStatusRequestBody } from './fulfillment/V202309/UpdatePackageDeliveryStatusRequestBody';
import { Fulfillment202309UpdatePackageDeliveryStatusRequestBodyPackages } from './fulfillment/V202309/UpdatePackageDeliveryStatusRequestBodyPackages';
import { Fulfillment202309UpdatePackageDeliveryStatusResponse } from './fulfillment/V202309/UpdatePackageDeliveryStatusResponse';
import { Fulfillment202309UpdatePackageDeliveryStatusResponseData } from './fulfillment/V202309/UpdatePackageDeliveryStatusResponseData';
import { Fulfillment202309UpdatePackageDeliveryStatusResponseDataErrors } from './fulfillment/V202309/UpdatePackageDeliveryStatusResponseDataErrors';
import { Fulfillment202309UpdatePackageDeliveryStatusResponseDataErrorsDetail } from './fulfillment/V202309/UpdatePackageDeliveryStatusResponseDataErrorsDetail';
import { Fulfillment202309UpdatePackageShippingInfoRequestBody } from './fulfillment/V202309/UpdatePackageShippingInfoRequestBody';
import { Fulfillment202309UpdatePackageShippingInfoResponse } from './fulfillment/V202309/UpdatePackageShippingInfoResponse';
import { Fulfillment202309UpdateShippingInfoRequestBody } from './fulfillment/V202309/UpdateShippingInfoRequestBody';
import { Fulfillment202309UpdateShippingInfoResponse } from './fulfillment/V202309/UpdateShippingInfoResponse';
import { Fulfillment202407CreateFirstMileBundleRequestBody } from './fulfillment/V202407/CreateFirstMileBundleRequestBody';
import { Fulfillment202407CreateFirstMileBundleResponse } from './fulfillment/V202407/CreateFirstMileBundleResponse';
import { Fulfillment202407CreateFirstMileBundleResponseData } from './fulfillment/V202407/CreateFirstMileBundleResponseData';
import { Fulfillment202407CreateFirstMileBundleResponseDataErrors } from './fulfillment/V202407/CreateFirstMileBundleResponseDataErrors';
import { Fulfillment202407CreateFirstMileBundleResponseDataErrorsDetail } from './fulfillment/V202407/CreateFirstMileBundleResponseDataErrorsDetail';
import { Fulfillment202502UploadInvoiceRequestBody } from './fulfillment/V202502/UploadInvoiceRequestBody';
import { Fulfillment202502UploadInvoiceRequestBodyInvoices } from './fulfillment/V202502/UploadInvoiceRequestBodyInvoices';
import { Fulfillment202502UploadInvoiceResponse } from './fulfillment/V202502/UploadInvoiceResponse';
import { Fulfillment202502UploadInvoiceResponseData } from './fulfillment/V202502/UploadInvoiceResponseData';
import { Fulfillment202502UploadInvoiceResponseDataErrors } from './fulfillment/V202502/UploadInvoiceResponseDataErrors';
import { Fulfillment202502UploadInvoiceResponseDataErrorsDetail } from './fulfillment/V202502/UploadInvoiceResponseDataErrorsDetail';
import { Logistics202309GetGlobalSellerWarehouseResponse } from './logistics/V202309/GetGlobalSellerWarehouseResponse';
import { Logistics202309GetGlobalSellerWarehouseResponseData } from './logistics/V202309/GetGlobalSellerWarehouseResponseData';
import { Logistics202309GetGlobalSellerWarehouseResponseDataGlobalWarehouses } from './logistics/V202309/GetGlobalSellerWarehouseResponseDataGlobalWarehouses';
import { Logistics202309GetShippingProvidersResponse } from './logistics/V202309/GetShippingProvidersResponse';
import { Logistics202309GetShippingProvidersResponseData } from './logistics/V202309/GetShippingProvidersResponseData';
import { Logistics202309GetShippingProvidersResponseDataShippingProviders } from './logistics/V202309/GetShippingProvidersResponseDataShippingProviders';
import { Logistics202309GetWarehouseDeliveryOptionsResponse } from './logistics/V202309/GetWarehouseDeliveryOptionsResponse';
import { Logistics202309GetWarehouseDeliveryOptionsResponseData } from './logistics/V202309/GetWarehouseDeliveryOptionsResponseData';
import { Logistics202309GetWarehouseDeliveryOptionsResponseDataDeliveryOptions } from './logistics/V202309/GetWarehouseDeliveryOptionsResponseDataDeliveryOptions';
import { Logistics202309GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsDimensionLimit } from './logistics/V202309/GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsDimensionLimit';
import { Logistics202309GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsWeightLimit } from './logistics/V202309/GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsWeightLimit';
import { Logistics202309GetWarehouseListResponse } from './logistics/V202309/GetWarehouseListResponse';
import { Logistics202309GetWarehouseListResponseData } from './logistics/V202309/GetWarehouseListResponseData';
import { Logistics202309GetWarehouseListResponseDataWarehouses } from './logistics/V202309/GetWarehouseListResponseDataWarehouses';
import { Logistics202309GetWarehouseListResponseDataWarehousesAddress } from './logistics/V202309/GetWarehouseListResponseDataWarehousesAddress';
import { Logistics202309GetWarehouseListResponseDataWarehousesAddressGeolocation } from './logistics/V202309/GetWarehouseListResponseDataWarehousesAddressGeolocation';
import { Order202309GetOrderDetailResponse } from './order/V202309/GetOrderDetailResponse';
import { Order202309GetOrderDetailResponseData } from './order/V202309/GetOrderDetailResponseData';
import { Order202309GetOrderDetailResponseDataOrders } from './order/V202309/GetOrderDetailResponseDataOrders';
import { Order202309GetOrderDetailResponseDataOrdersHandlingDuration } from './order/V202309/GetOrderDetailResponseDataOrdersHandlingDuration';
import { Order202309GetOrderDetailResponseDataOrdersLineItems } from './order/V202309/GetOrderDetailResponseDataOrdersLineItems';
import { Order202309GetOrderDetailResponseDataOrdersLineItemsCombinedListingSkus } from './order/V202309/GetOrderDetailResponseDataOrdersLineItemsCombinedListingSkus';
import { Order202309GetOrderDetailResponseDataOrdersLineItemsItemTax } from './order/V202309/GetOrderDetailResponseDataOrdersLineItemsItemTax';
import { Order202309GetOrderDetailResponseDataOrdersPackages } from './order/V202309/GetOrderDetailResponseDataOrdersPackages';
import { Order202309GetOrderDetailResponseDataOrdersPayment } from './order/V202309/GetOrderDetailResponseDataOrdersPayment';
import { Order202309GetOrderDetailResponseDataOrdersRecipientAddress } from './order/V202309/GetOrderDetailResponseDataOrdersRecipientAddress';
import { Order202309GetOrderDetailResponseDataOrdersRecipientAddressDeliveryPreferences } from './order/V202309/GetOrderDetailResponseDataOrdersRecipientAddressDeliveryPreferences';
import { Order202309GetOrderDetailResponseDataOrdersRecipientAddressDistrictInfo } from './order/V202309/GetOrderDetailResponseDataOrdersRecipientAddressDistrictInfo';
import { Order202309GetOrderListRequestBody } from './order/V202309/GetOrderListRequestBody';
import { Order202309GetOrderListResponse } from './order/V202309/GetOrderListResponse';
import { Order202309GetOrderListResponseData } from './order/V202309/GetOrderListResponseData';
import { Order202309GetOrderListResponseDataOrders } from './order/V202309/GetOrderListResponseDataOrders';
import { Order202309GetOrderListResponseDataOrdersHandlingDuration } from './order/V202309/GetOrderListResponseDataOrdersHandlingDuration';
import { Order202309GetOrderListResponseDataOrdersLineItems } from './order/V202309/GetOrderListResponseDataOrdersLineItems';
import { Order202309GetOrderListResponseDataOrdersLineItemsCombinedListingSkus } from './order/V202309/GetOrderListResponseDataOrdersLineItemsCombinedListingSkus';
import { Order202309GetOrderListResponseDataOrdersLineItemsItemTax } from './order/V202309/GetOrderListResponseDataOrdersLineItemsItemTax';
import { Order202309GetOrderListResponseDataOrdersPackages } from './order/V202309/GetOrderListResponseDataOrdersPackages';
import { Order202309GetOrderListResponseDataOrdersPayment } from './order/V202309/GetOrderListResponseDataOrdersPayment';
import { Order202309GetOrderListResponseDataOrdersRecipientAddress } from './order/V202309/GetOrderListResponseDataOrdersRecipientAddress';
import { Order202309GetOrderListResponseDataOrdersRecipientAddressDeliveryPreferences } from './order/V202309/GetOrderListResponseDataOrdersRecipientAddressDeliveryPreferences';
import { Order202309GetOrderListResponseDataOrdersRecipientAddressDistrictInfo } from './order/V202309/GetOrderListResponseDataOrdersRecipientAddressDistrictInfo';
import { Order202407GetPriceDetailResponse } from './order/V202407/GetPriceDetailResponse';
import { Order202407GetPriceDetailResponseData } from './order/V202407/GetPriceDetailResponseData';
import { Order202407GetPriceDetailResponseDataLineItems } from './order/V202407/GetPriceDetailResponseDataLineItems';
import { Product202309ActivateProductRequestBody } from './product/V202309/ActivateProductRequestBody';
import { Product202309ActivateProductResponse } from './product/V202309/ActivateProductResponse';
import { Product202309ActivateProductResponseData } from './product/V202309/ActivateProductResponseData';
import { Product202309ActivateProductResponseDataErrors } from './product/V202309/ActivateProductResponseDataErrors';
import { Product202309ActivateProductResponseDataErrorsDetail } from './product/V202309/ActivateProductResponseDataErrorsDetail';
import { Product202309ActivateProductResponseDataErrorsDetailExtraErrors } from './product/V202309/ActivateProductResponseDataErrorsDetailExtraErrors';
import { Product202309CheckListingPrerequisitesResponse } from './product/V202309/CheckListingPrerequisitesResponse';
import { Product202309CheckListingPrerequisitesResponseData } from './product/V202309/CheckListingPrerequisitesResponseData';
import { Product202309CheckListingPrerequisitesResponseDataShop } from './product/V202309/CheckListingPrerequisitesResponseDataShop';
import { Product202309CheckListingPrerequisitesResponseDataShopGne } from './product/V202309/CheckListingPrerequisitesResponseDataShopGne';
import { Product202309CheckListingPrerequisitesResponseDataShopLogistics } from './product/V202309/CheckListingPrerequisitesResponseDataShopLogistics';
import { Product202309CheckProductListingRequestBody } from './product/V202309/CheckProductListingRequestBody';
import { Product202309CheckProductListingRequestBodyCertifications } from './product/V202309/CheckProductListingRequestBodyCertifications';
import { Product202309CheckProductListingRequestBodyCertificationsFiles } from './product/V202309/CheckProductListingRequestBodyCertificationsFiles';
import { Product202309CheckProductListingRequestBodyCertificationsImages } from './product/V202309/CheckProductListingRequestBodyCertificationsImages';
import { Product202309CheckProductListingRequestBodyMainImages } from './product/V202309/CheckProductListingRequestBodyMainImages';
import { Product202309CheckProductListingRequestBodyPackageDimensions } from './product/V202309/CheckProductListingRequestBodyPackageDimensions';
import { Product202309CheckProductListingRequestBodyPackageWeight } from './product/V202309/CheckProductListingRequestBodyPackageWeight';
import { Product202309CheckProductListingRequestBodyProductAttributes } from './product/V202309/CheckProductListingRequestBodyProductAttributes';
import { Product202309CheckProductListingRequestBodyProductAttributesValues } from './product/V202309/CheckProductListingRequestBodyProductAttributesValues';
import { Product202309CheckProductListingRequestBodySizeChart } from './product/V202309/CheckProductListingRequestBodySizeChart';
import { Product202309CheckProductListingRequestBodySizeChartImage } from './product/V202309/CheckProductListingRequestBodySizeChartImage';
import { Product202309CheckProductListingRequestBodySizeChartTemplate } from './product/V202309/CheckProductListingRequestBodySizeChartTemplate';
import { Product202309CheckProductListingRequestBodySkus } from './product/V202309/CheckProductListingRequestBodySkus';
import { Product202309CheckProductListingRequestBodySkusCombinedSkus } from './product/V202309/CheckProductListingRequestBodySkusCombinedSkus';
import { Product202309CheckProductListingRequestBodySkusExternalListPrices } from './product/V202309/CheckProductListingRequestBodySkusExternalListPrices';
import { Product202309CheckProductListingRequestBodySkusIdentifierCode } from './product/V202309/CheckProductListingRequestBodySkusIdentifierCode';
import { Product202309CheckProductListingRequestBodySkusInventory } from './product/V202309/CheckProductListingRequestBodySkusInventory';
import { Product202309CheckProductListingRequestBodySkusListPrice } from './product/V202309/CheckProductListingRequestBodySkusListPrice';
import { Product202309CheckProductListingRequestBodySkusPreSale } from './product/V202309/CheckProductListingRequestBodySkusPreSale';
import { Product202309CheckProductListingRequestBodySkusPreSaleFulfillmentType } from './product/V202309/CheckProductListingRequestBodySkusPreSaleFulfillmentType';
import { Product202309CheckProductListingRequestBodySkusPrice } from './product/V202309/CheckProductListingRequestBodySkusPrice';
import { Product202309CheckProductListingRequestBodySkusSalesAttributes } from './product/V202309/CheckProductListingRequestBodySkusSalesAttributes';
import { Product202309CheckProductListingRequestBodySkusSalesAttributesSkuImg } from './product/V202309/CheckProductListingRequestBodySkusSalesAttributesSkuImg';
import { Product202309CheckProductListingRequestBodySkusSalesAttributesSupplementarySkuImages } from './product/V202309/CheckProductListingRequestBodySkusSalesAttributesSupplementarySkuImages';
import { Product202309CheckProductListingRequestBodyVideo } from './product/V202309/CheckProductListingRequestBodyVideo';
import { Product202309CheckProductListingResponse } from './product/V202309/CheckProductListingResponse';
import { Product202309CheckProductListingResponseData } from './product/V202309/CheckProductListingResponseData';
import { Product202309CheckProductListingResponseDataDiagnoses } from './product/V202309/CheckProductListingResponseDataDiagnoses';
import { Product202309CheckProductListingResponseDataDiagnosesDiagnosisResults } from './product/V202309/CheckProductListingResponseDataDiagnosesDiagnosisResults';
import { Product202309CheckProductListingResponseDataDiagnosesSuggestions } from './product/V202309/CheckProductListingResponseDataDiagnosesSuggestions';
import { Product202309CheckProductListingResponseDataDiagnosesSuggestionsImages } from './product/V202309/CheckProductListingResponseDataDiagnosesSuggestionsImages';
import { Product202309CheckProductListingResponseDataDiagnosesSuggestionsSeoWords } from './product/V202309/CheckProductListingResponseDataDiagnosesSuggestionsSeoWords';
import { Product202309CheckProductListingResponseDataDiagnosesSuggestionsSmartTexts } from './product/V202309/CheckProductListingResponseDataDiagnosesSuggestionsSmartTexts';
import { Product202309CheckProductListingResponseDataFailReasons } from './product/V202309/CheckProductListingResponseDataFailReasons';
import { Product202309CheckProductListingResponseDataListingQuality } from './product/V202309/CheckProductListingResponseDataListingQuality';
import { Product202309CheckProductListingResponseDataWarnings } from './product/V202309/CheckProductListingResponseDataWarnings';
import { Product202309CreateCustomBrandsRequestBody } from './product/V202309/CreateCustomBrandsRequestBody';
import { Product202309CreateCustomBrandsResponse } from './product/V202309/CreateCustomBrandsResponse';
import { Product202309CreateCustomBrandsResponseData } from './product/V202309/CreateCustomBrandsResponseData';
import { Product202309CreateGlobalProductRequestBody } from './product/V202309/CreateGlobalProductRequestBody';
import { Product202309CreateGlobalProductRequestBodyCertifications } from './product/V202309/CreateGlobalProductRequestBodyCertifications';
import { Product202309CreateGlobalProductRequestBodyCertificationsFiles } from './product/V202309/CreateGlobalProductRequestBodyCertificationsFiles';
import { Product202309CreateGlobalProductRequestBodyCertificationsImages } from './product/V202309/CreateGlobalProductRequestBodyCertificationsImages';
import { Product202309CreateGlobalProductRequestBodyMainImages } from './product/V202309/CreateGlobalProductRequestBodyMainImages';
import { Product202309CreateGlobalProductRequestBodyManufacturer } from './product/V202309/CreateGlobalProductRequestBodyManufacturer';
import { Product202309CreateGlobalProductRequestBodyPackageDimensions } from './product/V202309/CreateGlobalProductRequestBodyPackageDimensions';
import { Product202309CreateGlobalProductRequestBodyPackageWeight } from './product/V202309/CreateGlobalProductRequestBodyPackageWeight';
import { Product202309CreateGlobalProductRequestBodyProductAttributes } from './product/V202309/CreateGlobalProductRequestBodyProductAttributes';
import { Product202309CreateGlobalProductRequestBodyProductAttributesValues } from './product/V202309/CreateGlobalProductRequestBodyProductAttributesValues';
import { Product202309CreateGlobalProductRequestBodySizeChart } from './product/V202309/CreateGlobalProductRequestBodySizeChart';
import { Product202309CreateGlobalProductRequestBodySizeChartImage } from './product/V202309/CreateGlobalProductRequestBodySizeChartImage';
import { Product202309CreateGlobalProductRequestBodySizeChartTemplate } from './product/V202309/CreateGlobalProductRequestBodySizeChartTemplate';
import { Product202309CreateGlobalProductRequestBodySkus } from './product/V202309/CreateGlobalProductRequestBodySkus';
import { Product202309CreateGlobalProductRequestBodySkusIdentifierCode } from './product/V202309/CreateGlobalProductRequestBodySkusIdentifierCode';
import { Product202309CreateGlobalProductRequestBodySkusInventory } from './product/V202309/CreateGlobalProductRequestBodySkusInventory';
import { Product202309CreateGlobalProductRequestBodySkusPrice } from './product/V202309/CreateGlobalProductRequestBodySkusPrice';
import { Product202309CreateGlobalProductRequestBodySkusSalesAttributes } from './product/V202309/CreateGlobalProductRequestBodySkusSalesAttributes';
import { Product202309CreateGlobalProductRequestBodySkusSalesAttributesSkuImg } from './product/V202309/CreateGlobalProductRequestBodySkusSalesAttributesSkuImg';
import { Product202309CreateGlobalProductRequestBodyVideo } from './product/V202309/CreateGlobalProductRequestBodyVideo';
import { Product202309CreateGlobalProductResponse } from './product/V202309/CreateGlobalProductResponse';
import { Product202309CreateGlobalProductResponseData } from './product/V202309/CreateGlobalProductResponseData';
import { Product202309CreateGlobalProductResponseDataGlobalSkus } from './product/V202309/CreateGlobalProductResponseDataGlobalSkus';
import { Product202309CreateGlobalProductResponseDataGlobalSkusSalesAttributes } from './product/V202309/CreateGlobalProductResponseDataGlobalSkusSalesAttributes';
import { Product202309CreateProductRequestBody } from './product/V202309/CreateProductRequestBody';
import { Product202309CreateProductRequestBodyCertifications } from './product/V202309/CreateProductRequestBodyCertifications';
import { Product202309CreateProductRequestBodyCertificationsFiles } from './product/V202309/CreateProductRequestBodyCertificationsFiles';
import { Product202309CreateProductRequestBodyCertificationsImages } from './product/V202309/CreateProductRequestBodyCertificationsImages';
import { Product202309CreateProductRequestBodyMainImages } from './product/V202309/CreateProductRequestBodyMainImages';
import { Product202309CreateProductRequestBodyPackageDimensions } from './product/V202309/CreateProductRequestBodyPackageDimensions';
import { Product202309CreateProductRequestBodyPackageWeight } from './product/V202309/CreateProductRequestBodyPackageWeight';
import { Product202309CreateProductRequestBodyProductAttributes } from './product/V202309/CreateProductRequestBodyProductAttributes';
import { Product202309CreateProductRequestBodyProductAttributesValues } from './product/V202309/CreateProductRequestBodyProductAttributesValues';
import { Product202309CreateProductRequestBodySizeChart } from './product/V202309/CreateProductRequestBodySizeChart';
import { Product202309CreateProductRequestBodySizeChartImage } from './product/V202309/CreateProductRequestBodySizeChartImage';
import { Product202309CreateProductRequestBodySizeChartTemplate } from './product/V202309/CreateProductRequestBodySizeChartTemplate';
import { Product202309CreateProductRequestBodySkus } from './product/V202309/CreateProductRequestBodySkus';
import { Product202309CreateProductRequestBodySkusCombinedSkus } from './product/V202309/CreateProductRequestBodySkusCombinedSkus';
import { Product202309CreateProductRequestBodySkusExternalListPrices } from './product/V202309/CreateProductRequestBodySkusExternalListPrices';
import { Product202309CreateProductRequestBodySkusIdentifierCode } from './product/V202309/CreateProductRequestBodySkusIdentifierCode';
import { Product202309CreateProductRequestBodySkusInventory } from './product/V202309/CreateProductRequestBodySkusInventory';
import { Product202309CreateProductRequestBodySkusListPrice } from './product/V202309/CreateProductRequestBodySkusListPrice';
import { Product202309CreateProductRequestBodySkusPreSale } from './product/V202309/CreateProductRequestBodySkusPreSale';
import { Product202309CreateProductRequestBodySkusPreSaleFulfillmentType } from './product/V202309/CreateProductRequestBodySkusPreSaleFulfillmentType';
import { Product202309CreateProductRequestBodySkusPrice } from './product/V202309/CreateProductRequestBodySkusPrice';
import { Product202309CreateProductRequestBodySkusSalesAttributes } from './product/V202309/CreateProductRequestBodySkusSalesAttributes';
import { Product202309CreateProductRequestBodySkusSalesAttributesSkuImg } from './product/V202309/CreateProductRequestBodySkusSalesAttributesSkuImg';
import { Product202309CreateProductRequestBodySkusSalesAttributesSupplementarySkuImages } from './product/V202309/CreateProductRequestBodySkusSalesAttributesSupplementarySkuImages';
import { Product202309CreateProductRequestBodyVideo } from './product/V202309/CreateProductRequestBodyVideo';
import { Product202309CreateProductResponse } from './product/V202309/CreateProductResponse';
import { Product202309CreateProductResponseData } from './product/V202309/CreateProductResponseData';
import { Product202309CreateProductResponseDataSkus } from './product/V202309/CreateProductResponseDataSkus';
import { Product202309CreateProductResponseDataSkusSalesAttributes } from './product/V202309/CreateProductResponseDataSkusSalesAttributes';
import { Product202309CreateProductResponseDataWarnings } from './product/V202309/CreateProductResponseDataWarnings';
import { Product202309DeactivateProductsRequestBody } from './product/V202309/DeactivateProductsRequestBody';
import { Product202309DeactivateProductsResponse } from './product/V202309/DeactivateProductsResponse';
import { Product202309DeactivateProductsResponseData } from './product/V202309/DeactivateProductsResponseData';
import { Product202309DeactivateProductsResponseDataErrors } from './product/V202309/DeactivateProductsResponseDataErrors';
import { Product202309DeactivateProductsResponseDataErrorsDetail } from './product/V202309/DeactivateProductsResponseDataErrorsDetail';
import { Product202309DeleteGlobalProductsRequestBody } from './product/V202309/DeleteGlobalProductsRequestBody';
import { Product202309DeleteGlobalProductsResponse } from './product/V202309/DeleteGlobalProductsResponse';
import { Product202309DeleteGlobalProductsResponseData } from './product/V202309/DeleteGlobalProductsResponseData';
import { Product202309DeleteGlobalProductsResponseDataErrors } from './product/V202309/DeleteGlobalProductsResponseDataErrors';
import { Product202309DeleteGlobalProductsResponseDataErrorsDetail } from './product/V202309/DeleteGlobalProductsResponseDataErrorsDetail';
import { Product202309DeleteProductsRequestBody } from './product/V202309/DeleteProductsRequestBody';
import { Product202309DeleteProductsResponse } from './product/V202309/DeleteProductsResponse';
import { Product202309DeleteProductsResponseData } from './product/V202309/DeleteProductsResponseData';
import { Product202309DeleteProductsResponseDataErrors } from './product/V202309/DeleteProductsResponseDataErrors';
import { Product202309DeleteProductsResponseDataErrorsDetail } from './product/V202309/DeleteProductsResponseDataErrorsDetail';
import { Product202309EditGlobalProductRequestBody } from './product/V202309/EditGlobalProductRequestBody';
import { Product202309EditGlobalProductRequestBodyCertifications } from './product/V202309/EditGlobalProductRequestBodyCertifications';
import { Product202309EditGlobalProductRequestBodyCertificationsFiles } from './product/V202309/EditGlobalProductRequestBodyCertificationsFiles';
import { Product202309EditGlobalProductRequestBodyCertificationsImages } from './product/V202309/EditGlobalProductRequestBodyCertificationsImages';
import { Product202309EditGlobalProductRequestBodyMainImages } from './product/V202309/EditGlobalProductRequestBodyMainImages';
import { Product202309EditGlobalProductRequestBodyManufacturer } from './product/V202309/EditGlobalProductRequestBodyManufacturer';
import { Product202309EditGlobalProductRequestBodyPackageDimensions } from './product/V202309/EditGlobalProductRequestBodyPackageDimensions';
import { Product202309EditGlobalProductRequestBodyPackageWeight } from './product/V202309/EditGlobalProductRequestBodyPackageWeight';
import { Product202309EditGlobalProductRequestBodyProductAttributes } from './product/V202309/EditGlobalProductRequestBodyProductAttributes';
import { Product202309EditGlobalProductRequestBodyProductAttributesValues } from './product/V202309/EditGlobalProductRequestBodyProductAttributesValues';
import { Product202309EditGlobalProductRequestBodySizeChart } from './product/V202309/EditGlobalProductRequestBodySizeChart';
import { Product202309EditGlobalProductRequestBodySizeChartImage } from './product/V202309/EditGlobalProductRequestBodySizeChartImage';
import { Product202309EditGlobalProductRequestBodySizeChartTemplate } from './product/V202309/EditGlobalProductRequestBodySizeChartTemplate';
import { Product202309EditGlobalProductRequestBodySkus } from './product/V202309/EditGlobalProductRequestBodySkus';
import { Product202309EditGlobalProductRequestBodySkusIdentifierCode } from './product/V202309/EditGlobalProductRequestBodySkusIdentifierCode';
import { Product202309EditGlobalProductRequestBodySkusInventory } from './product/V202309/EditGlobalProductRequestBodySkusInventory';
import { Product202309EditGlobalProductRequestBodySkusPrice } from './product/V202309/EditGlobalProductRequestBodySkusPrice';
import { Product202309EditGlobalProductRequestBodySkusSalePrices } from './product/V202309/EditGlobalProductRequestBodySkusSalePrices';
import { Product202309EditGlobalProductRequestBodySkusSalesAttributes } from './product/V202309/EditGlobalProductRequestBodySkusSalesAttributes';
import { Product202309EditGlobalProductRequestBodySkusSalesAttributesSkuImg } from './product/V202309/EditGlobalProductRequestBodySkusSalesAttributesSkuImg';
import { Product202309EditGlobalProductRequestBodyVideo } from './product/V202309/EditGlobalProductRequestBodyVideo';
import { Product202309EditGlobalProductResponse } from './product/V202309/EditGlobalProductResponse';
import { Product202309EditGlobalProductResponseData } from './product/V202309/EditGlobalProductResponseData';
import { Product202309EditGlobalProductResponseDataGlobalSkus } from './product/V202309/EditGlobalProductResponseDataGlobalSkus';
import { Product202309EditGlobalProductResponseDataGlobalSkusSalesAttributes } from './product/V202309/EditGlobalProductResponseDataGlobalSkusSalesAttributes';
import { Product202309EditGlobalProductResponseDataPublishResults } from './product/V202309/EditGlobalProductResponseDataPublishResults';
import { Product202309EditGlobalProductResponseDataPublishResultsFailReasons } from './product/V202309/EditGlobalProductResponseDataPublishResultsFailReasons';
import { Product202309EditProductRequestBody } from './product/V202309/EditProductRequestBody';
import { Product202309EditProductRequestBodyCertifications } from './product/V202309/EditProductRequestBodyCertifications';
import { Product202309EditProductRequestBodyCertificationsFiles } from './product/V202309/EditProductRequestBodyCertificationsFiles';
import { Product202309EditProductRequestBodyCertificationsImages } from './product/V202309/EditProductRequestBodyCertificationsImages';
import { Product202309EditProductRequestBodyMainImages } from './product/V202309/EditProductRequestBodyMainImages';
import { Product202309EditProductRequestBodyPackageDimensions } from './product/V202309/EditProductRequestBodyPackageDimensions';
import { Product202309EditProductRequestBodyPackageWeight } from './product/V202309/EditProductRequestBodyPackageWeight';
import { Product202309EditProductRequestBodyProductAttributes } from './product/V202309/EditProductRequestBodyProductAttributes';
import { Product202309EditProductRequestBodyProductAttributesValues } from './product/V202309/EditProductRequestBodyProductAttributesValues';
import { Product202309EditProductRequestBodySizeChart } from './product/V202309/EditProductRequestBodySizeChart';
import { Product202309EditProductRequestBodySizeChartImage } from './product/V202309/EditProductRequestBodySizeChartImage';
import { Product202309EditProductRequestBodySizeChartTemplate } from './product/V202309/EditProductRequestBodySizeChartTemplate';
import { Product202309EditProductRequestBodySkus } from './product/V202309/EditProductRequestBodySkus';
import { Product202309EditProductRequestBodySkusCombinedSkus } from './product/V202309/EditProductRequestBodySkusCombinedSkus';
import { Product202309EditProductRequestBodySkusExternalListPrices } from './product/V202309/EditProductRequestBodySkusExternalListPrices';
import { Product202309EditProductRequestBodySkusIdentifierCode } from './product/V202309/EditProductRequestBodySkusIdentifierCode';
import { Product202309EditProductRequestBodySkusInventory } from './product/V202309/EditProductRequestBodySkusInventory';
import { Product202309EditProductRequestBodySkusListPrice } from './product/V202309/EditProductRequestBodySkusListPrice';
import { Product202309EditProductRequestBodySkusPreSale } from './product/V202309/EditProductRequestBodySkusPreSale';
import { Product202309EditProductRequestBodySkusPreSaleFulfillmentType } from './product/V202309/EditProductRequestBodySkusPreSaleFulfillmentType';
import { Product202309EditProductRequestBodySkusPrice } from './product/V202309/EditProductRequestBodySkusPrice';
import { Product202309EditProductRequestBodySkusSalesAttributes } from './product/V202309/EditProductRequestBodySkusSalesAttributes';
import { Product202309EditProductRequestBodySkusSalesAttributesSkuImg } from './product/V202309/EditProductRequestBodySkusSalesAttributesSkuImg';
import { Product202309EditProductRequestBodySkusSalesAttributesSupplementarySkuImages } from './product/V202309/EditProductRequestBodySkusSalesAttributesSupplementarySkuImages';
import { Product202309EditProductRequestBodyVideo } from './product/V202309/EditProductRequestBodyVideo';
import { Product202309EditProductResponse } from './product/V202309/EditProductResponse';
import { Product202309EditProductResponseData } from './product/V202309/EditProductResponseData';
import { Product202309EditProductResponseDataAudit } from './product/V202309/EditProductResponseDataAudit';
import { Product202309EditProductResponseDataSkus } from './product/V202309/EditProductResponseDataSkus';
import { Product202309EditProductResponseDataSkusSalesAttributes } from './product/V202309/EditProductResponseDataSkusSalesAttributes';
import { Product202309EditProductResponseDataWarnings } from './product/V202309/EditProductResponseDataWarnings';
import { Product202309GetAttributesResponse } from './product/V202309/GetAttributesResponse';
import { Product202309GetAttributesResponseData } from './product/V202309/GetAttributesResponseData';
import { Product202309GetAttributesResponseDataAttributes } from './product/V202309/GetAttributesResponseDataAttributes';
import { Product202309GetAttributesResponseDataAttributesRequirementConditions } from './product/V202309/GetAttributesResponseDataAttributesRequirementConditions';
import { Product202309GetAttributesResponseDataAttributesValues } from './product/V202309/GetAttributesResponseDataAttributesValues';
import { Product202309GetBrandsResponse } from './product/V202309/GetBrandsResponse';
import { Product202309GetBrandsResponseData } from './product/V202309/GetBrandsResponseData';
import { Product202309GetBrandsResponseDataBrands } from './product/V202309/GetBrandsResponseDataBrands';
import { Product202309GetCategoriesResponse } from './product/V202309/GetCategoriesResponse';
import { Product202309GetCategoriesResponseData } from './product/V202309/GetCategoriesResponseData';
import { Product202309GetCategoriesResponseDataCategories } from './product/V202309/GetCategoriesResponseDataCategories';
import { Product202309GetCategoryRulesResponse } from './product/V202309/GetCategoryRulesResponse';
import { Product202309GetCategoryRulesResponseData } from './product/V202309/GetCategoryRulesResponseData';
import { Product202309GetCategoryRulesResponseDataCod } from './product/V202309/GetCategoryRulesResponseDataCod';
import { Product202309GetCategoryRulesResponseDataEpr } from './product/V202309/GetCategoryRulesResponseDataEpr';
import { Product202309GetCategoryRulesResponseDataManufacturer } from './product/V202309/GetCategoryRulesResponseDataManufacturer';
import { Product202309GetCategoryRulesResponseDataPackageDimension } from './product/V202309/GetCategoryRulesResponseDataPackageDimension';
import { Product202309GetCategoryRulesResponseDataProductCertifications } from './product/V202309/GetCategoryRulesResponseDataProductCertifications';
import { Product202309GetCategoryRulesResponseDataProductCertificationsExpirationDate } from './product/V202309/GetCategoryRulesResponseDataProductCertificationsExpirationDate';
import { Product202309GetCategoryRulesResponseDataProductCertificationsRequirementConditions } from './product/V202309/GetCategoryRulesResponseDataProductCertificationsRequirementConditions';
import { Product202309GetCategoryRulesResponseDataResponsiblePerson } from './product/V202309/GetCategoryRulesResponseDataResponsiblePerson';
import { Product202309GetCategoryRulesResponseDataSizeChart } from './product/V202309/GetCategoryRulesResponseDataSizeChart';
import { Product202309GetGlobalAttributesResponse } from './product/V202309/GetGlobalAttributesResponse';
import { Product202309GetGlobalAttributesResponseData } from './product/V202309/GetGlobalAttributesResponseData';
import { Product202309GetGlobalAttributesResponseDataAttributes } from './product/V202309/GetGlobalAttributesResponseDataAttributes';
import { Product202309GetGlobalAttributesResponseDataAttributesRequirementConditions } from './product/V202309/GetGlobalAttributesResponseDataAttributesRequirementConditions';
import { Product202309GetGlobalAttributesResponseDataAttributesValues } from './product/V202309/GetGlobalAttributesResponseDataAttributesValues';
import { Product202309GetGlobalCategoriesResponse } from './product/V202309/GetGlobalCategoriesResponse';
import { Product202309GetGlobalCategoriesResponseData } from './product/V202309/GetGlobalCategoriesResponseData';
import { Product202309GetGlobalCategoriesResponseDataCategories } from './product/V202309/GetGlobalCategoriesResponseDataCategories';
import { Product202309GetGlobalCategoryRulesResponse } from './product/V202309/GetGlobalCategoryRulesResponse';
import { Product202309GetGlobalCategoryRulesResponseData } from './product/V202309/GetGlobalCategoryRulesResponseData';
import { Product202309GetGlobalCategoryRulesResponseDataManufacturer } from './product/V202309/GetGlobalCategoryRulesResponseDataManufacturer';
import { Product202309GetGlobalCategoryRulesResponseDataProductCertifications } from './product/V202309/GetGlobalCategoryRulesResponseDataProductCertifications';
import { Product202309GetGlobalCategoryRulesResponseDataProductCertificationsRequirementConditions } from './product/V202309/GetGlobalCategoryRulesResponseDataProductCertificationsRequirementConditions';
import { Product202309GetGlobalCategoryRulesResponseDataResponsiblePerson } from './product/V202309/GetGlobalCategoryRulesResponseDataResponsiblePerson';
import { Product202309GetGlobalCategoryRulesResponseDataSizeChart } from './product/V202309/GetGlobalCategoryRulesResponseDataSizeChart';
import { Product202309GetGlobalProductResponse } from './product/V202309/GetGlobalProductResponse';
import { Product202309GetGlobalProductResponseData } from './product/V202309/GetGlobalProductResponseData';
import { Product202309GetGlobalProductResponseDataBrand } from './product/V202309/GetGlobalProductResponseDataBrand';
import { Product202309GetGlobalProductResponseDataCategory } from './product/V202309/GetGlobalProductResponseDataCategory';
import { Product202309GetGlobalProductResponseDataCertifications } from './product/V202309/GetGlobalProductResponseDataCertifications';
import { Product202309GetGlobalProductResponseDataCertificationsFiles } from './product/V202309/GetGlobalProductResponseDataCertificationsFiles';
import { Product202309GetGlobalProductResponseDataCertificationsImages } from './product/V202309/GetGlobalProductResponseDataCertificationsImages';
import { Product202309GetGlobalProductResponseDataMainImages } from './product/V202309/GetGlobalProductResponseDataMainImages';
import { Product202309GetGlobalProductResponseDataManufacturer } from './product/V202309/GetGlobalProductResponseDataManufacturer';
import { Product202309GetGlobalProductResponseDataPackageDimensions } from './product/V202309/GetGlobalProductResponseDataPackageDimensions';
import { Product202309GetGlobalProductResponseDataPackageWeight } from './product/V202309/GetGlobalProductResponseDataPackageWeight';
import { Product202309GetGlobalProductResponseDataProductAttributes } from './product/V202309/GetGlobalProductResponseDataProductAttributes';
import { Product202309GetGlobalProductResponseDataProductAttributesValues } from './product/V202309/GetGlobalProductResponseDataProductAttributesValues';
import { Product202309GetGlobalProductResponseDataProducts } from './product/V202309/GetGlobalProductResponseDataProducts';
import { Product202309GetGlobalProductResponseDataProductsSkuMappings } from './product/V202309/GetGlobalProductResponseDataProductsSkuMappings';
import { Product202309GetGlobalProductResponseDataProductsSkuMappingsSalesAttributeMappings } from './product/V202309/GetGlobalProductResponseDataProductsSkuMappingsSalesAttributeMappings';
import { Product202309GetGlobalProductResponseDataSizeChart } from './product/V202309/GetGlobalProductResponseDataSizeChart';
import { Product202309GetGlobalProductResponseDataSizeChartImage } from './product/V202309/GetGlobalProductResponseDataSizeChartImage';
import { Product202309GetGlobalProductResponseDataSizeChartTemplate } from './product/V202309/GetGlobalProductResponseDataSizeChartTemplate';
import { Product202309GetGlobalProductResponseDataSkus } from './product/V202309/GetGlobalProductResponseDataSkus';
import { Product202309GetGlobalProductResponseDataSkusIdentifierCode } from './product/V202309/GetGlobalProductResponseDataSkusIdentifierCode';
import { Product202309GetGlobalProductResponseDataSkusInventory } from './product/V202309/GetGlobalProductResponseDataSkusInventory';
import { Product202309GetGlobalProductResponseDataSkusPrice } from './product/V202309/GetGlobalProductResponseDataSkusPrice';
import { Product202309GetGlobalProductResponseDataSkusSalesAttributes } from './product/V202309/GetGlobalProductResponseDataSkusSalesAttributes';
import { Product202309GetGlobalProductResponseDataSkusSalesAttributesSkuImg } from './product/V202309/GetGlobalProductResponseDataSkusSalesAttributesSkuImg';
import { Product202309GetGlobalProductResponseDataVideo } from './product/V202309/GetGlobalProductResponseDataVideo';
import { Product202309GetProductResponse } from './product/V202309/GetProductResponse';
import { Product202309GetProductResponseData } from './product/V202309/GetProductResponseData';
import { Product202309GetProductResponseDataAudit } from './product/V202309/GetProductResponseDataAudit';
import { Product202309GetProductResponseDataAuditFailedReasons } from './product/V202309/GetProductResponseDataAuditFailedReasons';
import { Product202309GetProductResponseDataBrand } from './product/V202309/GetProductResponseDataBrand';
import { Product202309GetProductResponseDataCategoryChains } from './product/V202309/GetProductResponseDataCategoryChains';
import { Product202309GetProductResponseDataCertifications } from './product/V202309/GetProductResponseDataCertifications';
import { Product202309GetProductResponseDataCertificationsFiles } from './product/V202309/GetProductResponseDataCertificationsFiles';
import { Product202309GetProductResponseDataCertificationsImages } from './product/V202309/GetProductResponseDataCertificationsImages';
import { Product202309GetProductResponseDataDeliveryOptions } from './product/V202309/GetProductResponseDataDeliveryOptions';
import { Product202309GetProductResponseDataGlobalProductAssociation } from './product/V202309/GetProductResponseDataGlobalProductAssociation';
import { Product202309GetProductResponseDataGlobalProductAssociationSkuMappings } from './product/V202309/GetProductResponseDataGlobalProductAssociationSkuMappings';
import { Product202309GetProductResponseDataGlobalProductAssociationSkuMappingsSalesAttributeMappings } from './product/V202309/GetProductResponseDataGlobalProductAssociationSkuMappingsSalesAttributeMappings';
import { Product202309GetProductResponseDataIntegratedPlatformStatuses } from './product/V202309/GetProductResponseDataIntegratedPlatformStatuses';
import { Product202309GetProductResponseDataMainImages } from './product/V202309/GetProductResponseDataMainImages';
import { Product202309GetProductResponseDataPackageDimensions } from './product/V202309/GetProductResponseDataPackageDimensions';
import { Product202309GetProductResponseDataPackageWeight } from './product/V202309/GetProductResponseDataPackageWeight';
import { Product202309GetProductResponseDataPrescriptionRequirement } from './product/V202309/GetProductResponseDataPrescriptionRequirement';
import { Product202309GetProductResponseDataProductAttributes } from './product/V202309/GetProductResponseDataProductAttributes';
import { Product202309GetProductResponseDataProductAttributesValues } from './product/V202309/GetProductResponseDataProductAttributesValues';
import { Product202309GetProductResponseDataProductFamilies } from './product/V202309/GetProductResponseDataProductFamilies';
import { Product202309GetProductResponseDataProductFamiliesProducts } from './product/V202309/GetProductResponseDataProductFamiliesProducts';
import { Product202309GetProductResponseDataRecommendedCategories } from './product/V202309/GetProductResponseDataRecommendedCategories';
import { Product202309GetProductResponseDataSizeChart } from './product/V202309/GetProductResponseDataSizeChart';
import { Product202309GetProductResponseDataSizeChartImage } from './product/V202309/GetProductResponseDataSizeChartImage';
import { Product202309GetProductResponseDataSizeChartTemplate } from './product/V202309/GetProductResponseDataSizeChartTemplate';
import { Product202309GetProductResponseDataSkus } from './product/V202309/GetProductResponseDataSkus';
import { Product202309GetProductResponseDataSkusCombinedSkus } from './product/V202309/GetProductResponseDataSkusCombinedSkus';
import { Product202309GetProductResponseDataSkusExternalListPrices } from './product/V202309/GetProductResponseDataSkusExternalListPrices';
import { Product202309GetProductResponseDataSkusGlobalListingPolicy } from './product/V202309/GetProductResponseDataSkusGlobalListingPolicy';
import { Product202309GetProductResponseDataSkusGlobalListingPolicyReplicateSource } from './product/V202309/GetProductResponseDataSkusGlobalListingPolicyReplicateSource';
import { Product202309GetProductResponseDataSkusIdentifierCode } from './product/V202309/GetProductResponseDataSkusIdentifierCode';
import { Product202309GetProductResponseDataSkusInventory } from './product/V202309/GetProductResponseDataSkusInventory';
import { Product202309GetProductResponseDataSkusListPrice } from './product/V202309/GetProductResponseDataSkusListPrice';
import { Product202309GetProductResponseDataSkusPreSale } from './product/V202309/GetProductResponseDataSkusPreSale';
import { Product202309GetProductResponseDataSkusPreSaleFulfillmentType } from './product/V202309/GetProductResponseDataSkusPreSaleFulfillmentType';
import { Product202309GetProductResponseDataSkusPrice } from './product/V202309/GetProductResponseDataSkusPrice';
import { Product202309GetProductResponseDataSkusSalesAttributes } from './product/V202309/GetProductResponseDataSkusSalesAttributes';
import { Product202309GetProductResponseDataSkusSalesAttributesSkuImg } from './product/V202309/GetProductResponseDataSkusSalesAttributesSkuImg';
import { Product202309GetProductResponseDataSkusSalesAttributesSupplementarySkuImages } from './product/V202309/GetProductResponseDataSkusSalesAttributesSupplementarySkuImages';
import { Product202309GetProductResponseDataVideo } from './product/V202309/GetProductResponseDataVideo';
import { Product202309InventorySearchRequestBody } from './product/V202309/InventorySearchRequestBody';
import { Product202309InventorySearchResponse } from './product/V202309/InventorySearchResponse';
import { Product202309InventorySearchResponseData } from './product/V202309/InventorySearchResponseData';
import { Product202309InventorySearchResponseDataInventory } from './product/V202309/InventorySearchResponseDataInventory';
import { Product202309InventorySearchResponseDataInventorySkus } from './product/V202309/InventorySearchResponseDataInventorySkus';
import { Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistribution } from './product/V202309/InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistribution';
import { Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCampaignInventory } from './product/V202309/InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCampaignInventory';
import { Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCreatorInventory } from './product/V202309/InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCreatorInventory';
import { Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionInShopInventory } from './product/V202309/InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionInShopInventory';
import { Product202309InventorySearchResponseDataInventorySkusWarehouseInventory } from './product/V202309/InventorySearchResponseDataInventorySkusWarehouseInventory';
import { Product202309PartialEditProductRequestBody } from './product/V202309/PartialEditProductRequestBody';
import { Product202309PartialEditProductRequestBodyCertifications } from './product/V202309/PartialEditProductRequestBodyCertifications';
import { Product202309PartialEditProductRequestBodyCertificationsFiles } from './product/V202309/PartialEditProductRequestBodyCertificationsFiles';
import { Product202309PartialEditProductRequestBodyCertificationsImages } from './product/V202309/PartialEditProductRequestBodyCertificationsImages';
import { Product202309PartialEditProductRequestBodyMainImages } from './product/V202309/PartialEditProductRequestBodyMainImages';
import { Product202309PartialEditProductRequestBodyPackageDimensions } from './product/V202309/PartialEditProductRequestBodyPackageDimensions';
import { Product202309PartialEditProductRequestBodyPackageWeight } from './product/V202309/PartialEditProductRequestBodyPackageWeight';
import { Product202309PartialEditProductRequestBodyProductAttributes } from './product/V202309/PartialEditProductRequestBodyProductAttributes';
import { Product202309PartialEditProductRequestBodyProductAttributesValues } from './product/V202309/PartialEditProductRequestBodyProductAttributesValues';
import { Product202309PartialEditProductRequestBodySizeChart } from './product/V202309/PartialEditProductRequestBodySizeChart';
import { Product202309PartialEditProductRequestBodySizeChartImage } from './product/V202309/PartialEditProductRequestBodySizeChartImage';
import { Product202309PartialEditProductRequestBodySizeChartTemplate } from './product/V202309/PartialEditProductRequestBodySizeChartTemplate';
import { Product202309PartialEditProductRequestBodySkus } from './product/V202309/PartialEditProductRequestBodySkus';
import { Product202309PartialEditProductRequestBodySkusExternalListPrices } from './product/V202309/PartialEditProductRequestBodySkusExternalListPrices';
import { Product202309PartialEditProductRequestBodySkusIdentifierCode } from './product/V202309/PartialEditProductRequestBodySkusIdentifierCode';
import { Product202309PartialEditProductRequestBodySkusInventory } from './product/V202309/PartialEditProductRequestBodySkusInventory';
import { Product202309PartialEditProductRequestBodySkusListPrice } from './product/V202309/PartialEditProductRequestBodySkusListPrice';
import { Product202309PartialEditProductRequestBodySkusPreSale } from './product/V202309/PartialEditProductRequestBodySkusPreSale';
import { Product202309PartialEditProductRequestBodySkusPreSaleFulfillmentType } from './product/V202309/PartialEditProductRequestBodySkusPreSaleFulfillmentType';
import { Product202309PartialEditProductRequestBodySkusPrice } from './product/V202309/PartialEditProductRequestBodySkusPrice';
import { Product202309PartialEditProductRequestBodySkusSalesAttributes } from './product/V202309/PartialEditProductRequestBodySkusSalesAttributes';
import { Product202309PartialEditProductRequestBodySkusSalesAttributesSkuImg } from './product/V202309/PartialEditProductRequestBodySkusSalesAttributesSkuImg';
import { Product202309PartialEditProductRequestBodySkusSalesAttributesSupplementarySkuImages } from './product/V202309/PartialEditProductRequestBodySkusSalesAttributesSupplementarySkuImages';
import { Product202309PartialEditProductRequestBodyVideo } from './product/V202309/PartialEditProductRequestBodyVideo';
import { Product202309PartialEditProductResponse } from './product/V202309/PartialEditProductResponse';
import { Product202309PartialEditProductResponseData } from './product/V202309/PartialEditProductResponseData';
import { Product202309PartialEditProductResponseDataAudit } from './product/V202309/PartialEditProductResponseDataAudit';
import { Product202309PartialEditProductResponseDataSkus } from './product/V202309/PartialEditProductResponseDataSkus';
import { Product202309PartialEditProductResponseDataSkusSalesAttributes } from './product/V202309/PartialEditProductResponseDataSkusSalesAttributes';
import { Product202309PublishGlobalProductRequestBody } from './product/V202309/PublishGlobalProductRequestBody';
import { Product202309PublishGlobalProductRequestBodyPublishTarget } from './product/V202309/PublishGlobalProductRequestBodyPublishTarget';
import { Product202309PublishGlobalProductRequestBodyPublishTargetSkus } from './product/V202309/PublishGlobalProductRequestBodyPublishTargetSkus';
import { Product202309PublishGlobalProductRequestBodyPublishTargetSkusInventory } from './product/V202309/PublishGlobalProductRequestBodyPublishTargetSkusInventory';
import { Product202309PublishGlobalProductRequestBodyPublishTargetSkusPrice } from './product/V202309/PublishGlobalProductRequestBodyPublishTargetSkusPrice';
import { Product202309PublishGlobalProductResponse } from './product/V202309/PublishGlobalProductResponse';
import { Product202309PublishGlobalProductResponseData } from './product/V202309/PublishGlobalProductResponseData';
import { Product202309PublishGlobalProductResponseDataProducts } from './product/V202309/PublishGlobalProductResponseDataProducts';
import { Product202309PublishGlobalProductResponseDataProductsSkus } from './product/V202309/PublishGlobalProductResponseDataProductsSkus';
import { Product202309PublishGlobalProductResponseDataProductsSkusSaleAttributes } from './product/V202309/PublishGlobalProductResponseDataProductsSkusSaleAttributes';
import { Product202309PublishGlobalProductResponseDataPublishResult } from './product/V202309/PublishGlobalProductResponseDataPublishResult';
import { Product202309PublishGlobalProductResponseDataPublishResultFailReasons } from './product/V202309/PublishGlobalProductResponseDataPublishResultFailReasons';
import { Product202309RecommendCategoryRequestBody } from './product/V202309/RecommendCategoryRequestBody';
import { Product202309RecommendCategoryRequestBodyImages } from './product/V202309/RecommendCategoryRequestBodyImages';
import { Product202309RecommendCategoryResponse } from './product/V202309/RecommendCategoryResponse';
import { Product202309RecommendCategoryResponseData } from './product/V202309/RecommendCategoryResponseData';
import { Product202309RecommendCategoryResponseDataCategories } from './product/V202309/RecommendCategoryResponseDataCategories';
import { Product202309RecommendGlobalCategoriesRequestBody } from './product/V202309/RecommendGlobalCategoriesRequestBody';
import { Product202309RecommendGlobalCategoriesRequestBodyImages } from './product/V202309/RecommendGlobalCategoriesRequestBodyImages';
import { Product202309RecommendGlobalCategoriesResponse } from './product/V202309/RecommendGlobalCategoriesResponse';
import { Product202309RecommendGlobalCategoriesResponseData } from './product/V202309/RecommendGlobalCategoriesResponseData';
import { Product202309RecommendGlobalCategoriesResponseDataCategories } from './product/V202309/RecommendGlobalCategoriesResponseDataCategories';
import { Product202309RecoverProductsRequestBody } from './product/V202309/RecoverProductsRequestBody';
import { Product202309RecoverProductsResponse } from './product/V202309/RecoverProductsResponse';
import { Product202309RecoverProductsResponseData } from './product/V202309/RecoverProductsResponseData';
import { Product202309RecoverProductsResponseDataErrors } from './product/V202309/RecoverProductsResponseDataErrors';
import { Product202309RecoverProductsResponseDataErrorsDetail } from './product/V202309/RecoverProductsResponseDataErrorsDetail';
import { Product202309SearchGlobalProductsRequestBody } from './product/V202309/SearchGlobalProductsRequestBody';
import { Product202309SearchGlobalProductsResponse } from './product/V202309/SearchGlobalProductsResponse';
import { Product202309SearchGlobalProductsResponseData } from './product/V202309/SearchGlobalProductsResponseData';
import { Product202309SearchGlobalProductsResponseDataGlobalProducts } from './product/V202309/SearchGlobalProductsResponseDataGlobalProducts';
import { Product202309SearchGlobalProductsResponseDataGlobalProductsSkus } from './product/V202309/SearchGlobalProductsResponseDataGlobalProductsSkus';
import { Product202309SearchProductsRequestBody } from './product/V202309/SearchProductsRequestBody';
import { Product202309SearchProductsResponse } from './product/V202309/SearchProductsResponse';
import { Product202309SearchProductsResponseData } from './product/V202309/SearchProductsResponseData';
import { Product202309SearchProductsResponseDataProducts } from './product/V202309/SearchProductsResponseDataProducts';
import { Product202309SearchProductsResponseDataProductsRecommendedCategories } from './product/V202309/SearchProductsResponseDataProductsRecommendedCategories';
import { Product202309SearchProductsResponseDataProductsSkus } from './product/V202309/SearchProductsResponseDataProductsSkus';
import { Product202309SearchProductsResponseDataProductsSkusInventory } from './product/V202309/SearchProductsResponseDataProductsSkusInventory';
import { Product202309SearchProductsResponseDataProductsSkusPrice } from './product/V202309/SearchProductsResponseDataProductsSkusPrice';
import { Product202309UpdateGlobalInventoryRequestBody } from './product/V202309/UpdateGlobalInventoryRequestBody';
import { Product202309UpdateGlobalInventoryRequestBodyGlobalSkus } from './product/V202309/UpdateGlobalInventoryRequestBodyGlobalSkus';
import { Product202309UpdateGlobalInventoryRequestBodyGlobalSkusInventory } from './product/V202309/UpdateGlobalInventoryRequestBodyGlobalSkusInventory';
import { Product202309UpdateGlobalInventoryResponse } from './product/V202309/UpdateGlobalInventoryResponse';
import { Product202309UpdateInventoryRequestBody } from './product/V202309/UpdateInventoryRequestBody';
import { Product202309UpdateInventoryRequestBodySkus } from './product/V202309/UpdateInventoryRequestBodySkus';
import { Product202309UpdateInventoryRequestBodySkusInventory } from './product/V202309/UpdateInventoryRequestBodySkusInventory';
import { Product202309UpdateInventoryResponse } from './product/V202309/UpdateInventoryResponse';
import { Product202309UpdateInventoryResponseData } from './product/V202309/UpdateInventoryResponseData';
import { Product202309UpdateInventoryResponseDataErrors } from './product/V202309/UpdateInventoryResponseDataErrors';
import { Product202309UpdateInventoryResponseDataErrorsDetail } from './product/V202309/UpdateInventoryResponseDataErrorsDetail';
import { Product202309UpdateInventoryResponseDataErrorsDetailExtraErrors } from './product/V202309/UpdateInventoryResponseDataErrorsDetailExtraErrors';
import { Product202309UpdatePriceRequestBody } from './product/V202309/UpdatePriceRequestBody';
import { Product202309UpdatePriceRequestBodySkus } from './product/V202309/UpdatePriceRequestBodySkus';
import { Product202309UpdatePriceRequestBodySkusExternalListPrices } from './product/V202309/UpdatePriceRequestBodySkusExternalListPrices';
import { Product202309UpdatePriceRequestBodySkusListPrice } from './product/V202309/UpdatePriceRequestBodySkusListPrice';
import { Product202309UpdatePriceRequestBodySkusPrice } from './product/V202309/UpdatePriceRequestBodySkusPrice';
import { Product202309UpdatePriceResponse } from './product/V202309/UpdatePriceResponse';
import { Product202309UploadProductFileResponse } from './product/V202309/UploadProductFileResponse';
import { Product202309UploadProductFileResponseData } from './product/V202309/UploadProductFileResponseData';
import { Product202309UploadProductImageResponse } from './product/V202309/UploadProductImageResponse';
import { Product202309UploadProductImageResponseData } from './product/V202309/UploadProductImageResponseData';
import { Product202312CheckListingPrerequisitesResponse } from './product/V202312/CheckListingPrerequisitesResponse';
import { Product202312CheckListingPrerequisitesResponseData } from './product/V202312/CheckListingPrerequisitesResponseData';
import { Product202312CheckListingPrerequisitesResponseDataCheckResults } from './product/V202312/CheckListingPrerequisitesResponseDataCheckResults';
import { Product202312SearchGlobalProductsRequestBody } from './product/V202312/SearchGlobalProductsRequestBody';
import { Product202312SearchGlobalProductsResponse } from './product/V202312/SearchGlobalProductsResponse';
import { Product202312SearchGlobalProductsResponseData } from './product/V202312/SearchGlobalProductsResponseData';
import { Product202312SearchGlobalProductsResponseDataGlobalProducts } from './product/V202312/SearchGlobalProductsResponseDataGlobalProducts';
import { Product202312SearchGlobalProductsResponseDataGlobalProductsSkus } from './product/V202312/SearchGlobalProductsResponseDataGlobalProductsSkus';
import { Product202312SearchProductsRequestBody } from './product/V202312/SearchProductsRequestBody';
import { Product202312SearchProductsResponse } from './product/V202312/SearchProductsResponse';
import { Product202312SearchProductsResponseData } from './product/V202312/SearchProductsResponseData';
import { Product202312SearchProductsResponseDataProducts } from './product/V202312/SearchProductsResponseDataProducts';
import { Product202312SearchProductsResponseDataProductsAudit } from './product/V202312/SearchProductsResponseDataProductsAudit';
import { Product202312SearchProductsResponseDataProductsIntegratedPlatformStatuses } from './product/V202312/SearchProductsResponseDataProductsIntegratedPlatformStatuses';
import { Product202312SearchProductsResponseDataProductsRecommendedCategories } from './product/V202312/SearchProductsResponseDataProductsRecommendedCategories';
import { Product202312SearchProductsResponseDataProductsSkus } from './product/V202312/SearchProductsResponseDataProductsSkus';
import { Product202312SearchProductsResponseDataProductsSkusExternalListPrices } from './product/V202312/SearchProductsResponseDataProductsSkusExternalListPrices';
import { Product202312SearchProductsResponseDataProductsSkusInventory } from './product/V202312/SearchProductsResponseDataProductsSkusInventory';
import { Product202312SearchProductsResponseDataProductsSkusListPrice } from './product/V202312/SearchProductsResponseDataProductsSkusListPrice';
import { Product202312SearchProductsResponseDataProductsSkusPrice } from './product/V202312/SearchProductsResponseDataProductsSkusPrice';
import { Product202401ListingSchemasResponse } from './product/V202401/ListingSchemasResponse';
import { Product202401ListingSchemasResponseData } from './product/V202401/ListingSchemasResponseData';
import { Product202401ListingSchemasResponseDataErrors } from './product/V202401/ListingSchemasResponseDataErrors';
import { Product202401ListingSchemasResponseDataErrorsDetail } from './product/V202401/ListingSchemasResponseDataErrorsDetail';
import { Product202401ListingSchemasResponseDataListingSchemas } from './product/V202401/ListingSchemasResponseDataListingSchemas';
import { Product202401ListingSchemasResponseDataListingSchemasFileds } from './product/V202401/ListingSchemasResponseDataListingSchemasFileds';
import { Product202401ListingSchemasResponseDataListingSchemasFiledsComplexValues } from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsComplexValues';
import { Product202401ListingSchemasResponseDataListingSchemasFiledsComplexValuesOptions } from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsComplexValuesOptions';
import { Product202401ListingSchemasResponseDataListingSchemasFiledsComplexValuesRules } from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsComplexValuesRules';
import { Product202401ListingSchemasResponseDataListingSchemasFiledsOptions } from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsOptions';
import { Product202401ListingSchemasResponseDataListingSchemasFiledsRules } from './product/V202401/ListingSchemasResponseDataListingSchemasFiledsRules';
import { Product202404OptimizedImagesRequestBody } from './product/V202404/OptimizedImagesRequestBody';
import { Product202404OptimizedImagesRequestBodyImages } from './product/V202404/OptimizedImagesRequestBodyImages';
import { Product202404OptimizedImagesResponse } from './product/V202404/OptimizedImagesResponse';
import { Product202404OptimizedImagesResponseData } from './product/V202404/OptimizedImagesResponseData';
import { Product202404OptimizedImagesResponseDataImages } from './product/V202404/OptimizedImagesResponseDataImages';
import { Product202405GetProductsSEOWordsResponse } from './product/V202405/GetProductsSEOWordsResponse';
import { Product202405GetProductsSEOWordsResponseData } from './product/V202405/GetProductsSEOWordsResponseData';
import { Product202405GetProductsSEOWordsResponseDataProducts } from './product/V202405/GetProductsSEOWordsResponseDataProducts';
import { Product202405GetProductsSEOWordsResponseDataProductsSeoWords } from './product/V202405/GetProductsSEOWordsResponseDataProductsSeoWords';
import { Product202405GetRecommendedProductTitleAndDescriptionResponse } from './product/V202405/GetRecommendedProductTitleAndDescriptionResponse';
import { Product202405GetRecommendedProductTitleAndDescriptionResponseData } from './product/V202405/GetRecommendedProductTitleAndDescriptionResponseData';
import { Product202405GetRecommendedProductTitleAndDescriptionResponseDataProducts } from './product/V202405/GetRecommendedProductTitleAndDescriptionResponseDataProducts';
import { Product202405GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestions } from './product/V202405/GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestions';
import { Product202405GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestionsItems } from './product/V202405/GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestionsItems';
import { Product202405ProductInformationIssueDiagnosisResponse } from './product/V202405/ProductInformationIssueDiagnosisResponse';
import { Product202405ProductInformationIssueDiagnosisResponseData } from './product/V202405/ProductInformationIssueDiagnosisResponseData';
import { Product202405ProductInformationIssueDiagnosisResponseDataProducts } from './product/V202405/ProductInformationIssueDiagnosisResponseDataProducts';
import { Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnoses } from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnoses';
import { Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesDiagnosisResults } from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesDiagnosisResults';
import { Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestion } from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestion';
import { Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionImages } from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionImages';
import { Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSeoWords } from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSeoWords';
import { Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSmartTexts } from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSmartTexts';
import { Product202405ProductInformationIssueDiagnosisResponseDataProductsListingQuality } from './product/V202405/ProductInformationIssueDiagnosisResponseDataProductsListingQuality';
import { Product202407CreateCategoryUpgradeTaskResponse } from './product/V202407/CreateCategoryUpgradeTaskResponse';
import { Product202407ListingSchemasResponse } from './product/V202407/ListingSchemasResponse';
import { Product202407ListingSchemasResponseData } from './product/V202407/ListingSchemasResponseData';
import { Product202407ListingSchemasResponseDataErrors } from './product/V202407/ListingSchemasResponseDataErrors';
import { Product202407ListingSchemasResponseDataErrorsDetail } from './product/V202407/ListingSchemasResponseDataErrorsDetail';
import { Product202407ListingSchemasResponseDataListingSchemas } from './product/V202407/ListingSchemasResponseDataListingSchemas';
import { Product202407ListingSchemasResponseDataListingSchemasFields } from './product/V202407/ListingSchemasResponseDataListingSchemasFields';
import { Product202407ListingSchemasResponseDataListingSchemasFieldsComplexValues } from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsComplexValues';
import { Product202407ListingSchemasResponseDataListingSchemasFieldsComplexValuesOptions } from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsComplexValuesOptions';
import { Product202407ListingSchemasResponseDataListingSchemasFieldsComplexValuesRules } from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsComplexValuesRules';
import { Product202407ListingSchemasResponseDataListingSchemasFieldsOptions } from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsOptions';
import { Product202407ListingSchemasResponseDataListingSchemasFieldsRules } from './product/V202407/ListingSchemasResponseDataListingSchemasFieldsRules';
import { Product202407SearchSizeChartsRequestBody } from './product/V202407/SearchSizeChartsRequestBody';
import { Product202407SearchSizeChartsResponse } from './product/V202407/SearchSizeChartsResponse';
import { Product202407SearchSizeChartsResponseData } from './product/V202407/SearchSizeChartsResponseData';
import { Product202407SearchSizeChartsResponseDataSizeChart } from './product/V202407/SearchSizeChartsResponseDataSizeChart';
import { Product202407SearchSizeChartsResponseDataSizeChartImages } from './product/V202407/SearchSizeChartsResponseDataSizeChartImages';
import { Product202409CreateManufacturerRequestBody } from './product/V202409/CreateManufacturerRequestBody';
import { Product202409CreateManufacturerRequestBodyPhoneNumber } from './product/V202409/CreateManufacturerRequestBodyPhoneNumber';
import { Product202409CreateManufacturerResponse } from './product/V202409/CreateManufacturerResponse';
import { Product202409CreateManufacturerResponseData } from './product/V202409/CreateManufacturerResponseData';
import { Product202409CreateResponsiblePersonRequestBody } from './product/V202409/CreateResponsiblePersonRequestBody';
import { Product202409CreateResponsiblePersonRequestBodyAddress } from './product/V202409/CreateResponsiblePersonRequestBodyAddress';
import { Product202409CreateResponsiblePersonRequestBodyPhoneNumber } from './product/V202409/CreateResponsiblePersonRequestBodyPhoneNumber';
import { Product202409CreateResponsiblePersonResponse } from './product/V202409/CreateResponsiblePersonResponse';
import { Product202409CreateResponsiblePersonResponseData } from './product/V202409/CreateResponsiblePersonResponseData';
import { Product202409PartialEditManufacturerRequestBody } from './product/V202409/PartialEditManufacturerRequestBody';
import { Product202409PartialEditManufacturerRequestBodyPhoneNumber } from './product/V202409/PartialEditManufacturerRequestBodyPhoneNumber';
import { Product202409PartialEditManufacturerResponse } from './product/V202409/PartialEditManufacturerResponse';
import { Product202409PartialEditResponsiblePersonRequestBody } from './product/V202409/PartialEditResponsiblePersonRequestBody';
import { Product202409PartialEditResponsiblePersonRequestBodyAddress } from './product/V202409/PartialEditResponsiblePersonRequestBodyAddress';
import { Product202409PartialEditResponsiblePersonRequestBodyPhoneNumber } from './product/V202409/PartialEditResponsiblePersonRequestBodyPhoneNumber';
import { Product202409PartialEditResponsiblePersonResponse } from './product/V202409/PartialEditResponsiblePersonResponse';
import { Product202409SearchManufacturersRequestBody } from './product/V202409/SearchManufacturersRequestBody';
import { Product202409SearchManufacturersResponse } from './product/V202409/SearchManufacturersResponse';
import { Product202409SearchManufacturersResponseData } from './product/V202409/SearchManufacturersResponseData';
import { Product202409SearchManufacturersResponseDataManufacturers } from './product/V202409/SearchManufacturersResponseDataManufacturers';
import { Product202409SearchManufacturersResponseDataManufacturersPhoneNumber } from './product/V202409/SearchManufacturersResponseDataManufacturersPhoneNumber';
import { Product202409SearchResponsiblePersonsRequestBody } from './product/V202409/SearchResponsiblePersonsRequestBody';
import { Product202409SearchResponsiblePersonsResponse } from './product/V202409/SearchResponsiblePersonsResponse';
import { Product202409SearchResponsiblePersonsResponseData } from './product/V202409/SearchResponsiblePersonsResponseData';
import { Product202409SearchResponsiblePersonsResponseDataResponsiblePersons } from './product/V202409/SearchResponsiblePersonsResponseDataResponsiblePersons';
import { Product202409SearchResponsiblePersonsResponseDataResponsiblePersonsAddress } from './product/V202409/SearchResponsiblePersonsResponseDataResponsiblePersonsAddress';
import { Product202409SearchResponsiblePersonsResponseDataResponsiblePersonsPhoneNumber } from './product/V202409/SearchResponsiblePersonsResponseDataResponsiblePersonsPhoneNumber';
import { Product202501SearchManufacturersRequestBody } from './product/V202501/SearchManufacturersRequestBody';
import { Product202501SearchManufacturersResponse } from './product/V202501/SearchManufacturersResponse';
import { Product202501SearchManufacturersResponseData } from './product/V202501/SearchManufacturersResponseData';
import { Product202501SearchManufacturersResponseDataManufacturers } from './product/V202501/SearchManufacturersResponseDataManufacturers';
import { Product202501SearchManufacturersResponseDataManufacturersRegionalProfiles } from './product/V202501/SearchManufacturersResponseDataManufacturersRegionalProfiles';
import { Product202501SearchManufacturersResponseDataManufacturersRegionalProfilesPhoneNumber } from './product/V202501/SearchManufacturersResponseDataManufacturersRegionalProfilesPhoneNumber';
import { Product202501SearchResponsiblePersonsRequestBody } from './product/V202501/SearchResponsiblePersonsRequestBody';
import { Product202501SearchResponsiblePersonsResponse } from './product/V202501/SearchResponsiblePersonsResponse';
import { Product202501SearchResponsiblePersonsResponseData } from './product/V202501/SearchResponsiblePersonsResponseData';
import { Product202501SearchResponsiblePersonsResponseDataResponsiblePersons } from './product/V202501/SearchResponsiblePersonsResponseDataResponsiblePersons';
import { Product202501SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfiles } from './product/V202501/SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfiles';
import { Product202501SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesAddress } from './product/V202501/SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesAddress';
import { Product202501SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesPhoneNumber } from './product/V202501/SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesPhoneNumber';
import { Product202502SearchProductsRequestBody } from './product/V202502/SearchProductsRequestBody';
import { Product202502SearchProductsResponse } from './product/V202502/SearchProductsResponse';
import { Product202502SearchProductsResponseData } from './product/V202502/SearchProductsResponseData';
import { Product202502SearchProductsResponseDataProducts } from './product/V202502/SearchProductsResponseDataProducts';
import { Product202502SearchProductsResponseDataProductsAudit } from './product/V202502/SearchProductsResponseDataProductsAudit';
import { Product202502SearchProductsResponseDataProductsIntegratedPlatformStatuses } from './product/V202502/SearchProductsResponseDataProductsIntegratedPlatformStatuses';
import { Product202502SearchProductsResponseDataProductsProductFamilies } from './product/V202502/SearchProductsResponseDataProductsProductFamilies';
import { Product202502SearchProductsResponseDataProductsProductFamiliesProducts } from './product/V202502/SearchProductsResponseDataProductsProductFamiliesProducts';
import { Product202502SearchProductsResponseDataProductsRecommendedCategories } from './product/V202502/SearchProductsResponseDataProductsRecommendedCategories';
import { Product202502SearchProductsResponseDataProductsSkus } from './product/V202502/SearchProductsResponseDataProductsSkus';
import { Product202502SearchProductsResponseDataProductsSkusExternalListPrices } from './product/V202502/SearchProductsResponseDataProductsSkusExternalListPrices';
import { Product202502SearchProductsResponseDataProductsSkusInventory } from './product/V202502/SearchProductsResponseDataProductsSkusInventory';
import { Product202502SearchProductsResponseDataProductsSkusListPrice } from './product/V202502/SearchProductsResponseDataProductsSkusListPrice';
import { Product202502SearchProductsResponseDataProductsSkusPreSale } from './product/V202502/SearchProductsResponseDataProductsSkusPreSale';
import { Product202502SearchProductsResponseDataProductsSkusPreSaleFulfillmentType } from './product/V202502/SearchProductsResponseDataProductsSkusPreSaleFulfillmentType';
import { Product202502SearchProductsResponseDataProductsSkusPrice } from './product/V202502/SearchProductsResponseDataProductsSkusPrice';
import { Product202505CreateImageTranslationTasksRequestBody } from './product/V202505/CreateImageTranslationTasksRequestBody';
import { Product202505CreateImageTranslationTasksRequestBodyImages } from './product/V202505/CreateImageTranslationTasksRequestBodyImages';
import { Product202505CreateImageTranslationTasksResponse } from './product/V202505/CreateImageTranslationTasksResponse';
import { Product202505CreateImageTranslationTasksResponseData } from './product/V202505/CreateImageTranslationTasksResponseData';
import { Product202505CreateImageTranslationTasksResponseDataTranslationTasks } from './product/V202505/CreateImageTranslationTasksResponseDataTranslationTasks';
import { Product202506GetImageTranslationTasksResponse } from './product/V202506/GetImageTranslationTasksResponse';
import { Product202506GetImageTranslationTasksResponseData } from './product/V202506/GetImageTranslationTasksResponseData';
import { Product202506GetImageTranslationTasksResponseDataTranslationTasks } from './product/V202506/GetImageTranslationTasksResponseDataTranslationTasks';
import { Product202506GetImageTranslationTasksResponseDataTranslationTasksOriginalImage } from './product/V202506/GetImageTranslationTasksResponseDataTranslationTasksOriginalImage';
import { Product202506GetImageTranslationTasksResponseDataTranslationTasksTranslatedImage } from './product/V202506/GetImageTranslationTasksResponseDataTranslationTasksTranslatedImage';
import { Promotion202309CreateActivityRequestBody } from './promotion/V202309/CreateActivityRequestBody';
import { Promotion202309CreateActivityRequestBodyDiscount } from './promotion/V202309/CreateActivityRequestBodyDiscount';
import { Promotion202309CreateActivityRequestBodyDiscountBmsmDiscount } from './promotion/V202309/CreateActivityRequestBodyDiscountBmsmDiscount';
import { Promotion202309CreateActivityRequestBodyDiscountBmsmDiscountDetails } from './promotion/V202309/CreateActivityRequestBodyDiscountBmsmDiscountDetails';
import { Promotion202309CreateActivityRequestBodyDiscountGiftDiscount } from './promotion/V202309/CreateActivityRequestBodyDiscountGiftDiscount';
import { Promotion202309CreateActivityRequestBodyDiscountGiftDiscountGiftInfos } from './promotion/V202309/CreateActivityRequestBodyDiscountGiftDiscountGiftInfos';
import { Promotion202309CreateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails } from './promotion/V202309/CreateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails';
import { Promotion202309CreateActivityRequestBodyDiscountShippingDiscount } from './promotion/V202309/CreateActivityRequestBodyDiscountShippingDiscount';
import { Promotion202309CreateActivityRequestBodyDiscountShippingDiscountAreaScope } from './promotion/V202309/CreateActivityRequestBodyDiscountShippingDiscountAreaScope';
import { Promotion202309CreateActivityRequestBodyParticipationLimit } from './promotion/V202309/CreateActivityRequestBodyParticipationLimit';
import { Promotion202309CreateActivityResponse } from './promotion/V202309/CreateActivityResponse';
import { Promotion202309CreateActivityResponseData } from './promotion/V202309/CreateActivityResponseData';
import { Promotion202309DeactivateActivityResponse } from './promotion/V202309/DeactivateActivityResponse';
import { Promotion202309DeactivateActivityResponseData } from './promotion/V202309/DeactivateActivityResponseData';
import { Promotion202309GetActivityResponse } from './promotion/V202309/GetActivityResponse';
import { Promotion202309GetActivityResponseData } from './promotion/V202309/GetActivityResponseData';
import { Promotion202309GetActivityResponseDataDiscount } from './promotion/V202309/GetActivityResponseDataDiscount';
import { Promotion202309GetActivityResponseDataDiscountBmsmDiscount } from './promotion/V202309/GetActivityResponseDataDiscountBmsmDiscount';
import { Promotion202309GetActivityResponseDataDiscountBmsmDiscountDetails } from './promotion/V202309/GetActivityResponseDataDiscountBmsmDiscountDetails';
import { Promotion202309GetActivityResponseDataDiscountGiftDiscount } from './promotion/V202309/GetActivityResponseDataDiscountGiftDiscount';
import { Promotion202309GetActivityResponseDataDiscountGiftDiscountGiftInfos } from './promotion/V202309/GetActivityResponseDataDiscountGiftDiscountGiftInfos';
import { Promotion202309GetActivityResponseDataDiscountGiftDiscountGiftInfosGiftDetails } from './promotion/V202309/GetActivityResponseDataDiscountGiftDiscountGiftInfosGiftDetails';
import { Promotion202309GetActivityResponseDataDiscountShippingDiscount } from './promotion/V202309/GetActivityResponseDataDiscountShippingDiscount';
import { Promotion202309GetActivityResponseDataDiscountShippingDiscountAreaScope } from './promotion/V202309/GetActivityResponseDataDiscountShippingDiscountAreaScope';
import { Promotion202309GetActivityResponseDataParticipationLimit } from './promotion/V202309/GetActivityResponseDataParticipationLimit';
import { Promotion202309GetActivityResponseDataProducts } from './promotion/V202309/GetActivityResponseDataProducts';
import { Promotion202309GetActivityResponseDataProductsActivityPrice } from './promotion/V202309/GetActivityResponseDataProductsActivityPrice';
import { Promotion202309GetActivityResponseDataProductsSkus } from './promotion/V202309/GetActivityResponseDataProductsSkus';
import { Promotion202309GetActivityResponseDataProductsSkusActivityPrice } from './promotion/V202309/GetActivityResponseDataProductsSkusActivityPrice';
import { Promotion202309RemoveActivityProductRequestBody } from './promotion/V202309/RemoveActivityProductRequestBody';
import { Promotion202309RemoveActivityProductResponse } from './promotion/V202309/RemoveActivityProductResponse';
import { Promotion202309RemoveActivityProductResponseData } from './promotion/V202309/RemoveActivityProductResponseData';
import { Promotion202309SearchActivitiesRequestBody } from './promotion/V202309/SearchActivitiesRequestBody';
import { Promotion202309SearchActivitiesResponse } from './promotion/V202309/SearchActivitiesResponse';
import { Promotion202309SearchActivitiesResponseData } from './promotion/V202309/SearchActivitiesResponseData';
import { Promotion202309SearchActivitiesResponseDataActivities } from './promotion/V202309/SearchActivitiesResponseDataActivities';
import { Promotion202309SearchActivitiesResponseDataActivitiesDiscount } from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscount';
import { Promotion202309SearchActivitiesResponseDataActivitiesDiscountBmsmDiscount } from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountBmsmDiscount';
import { Promotion202309SearchActivitiesResponseDataActivitiesDiscountBmsmDiscountDetails } from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountBmsmDiscountDetails';
import { Promotion202309SearchActivitiesResponseDataActivitiesDiscountGiftDiscount } from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountGiftDiscount';
import { Promotion202309SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfos } from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfos';
import { Promotion202309SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfosGiftDetails } from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfosGiftDetails';
import { Promotion202309SearchActivitiesResponseDataActivitiesDiscountShippingDiscount } from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountShippingDiscount';
import { Promotion202309SearchActivitiesResponseDataActivitiesDiscountShippingDiscountAreaScope } from './promotion/V202309/SearchActivitiesResponseDataActivitiesDiscountShippingDiscountAreaScope';
import { Promotion202309SearchActivitiesResponseDataActivitiesParticipationLimit } from './promotion/V202309/SearchActivitiesResponseDataActivitiesParticipationLimit';
import { Promotion202309UpdateActivityProductRequestBody } from './promotion/V202309/UpdateActivityProductRequestBody';
import { Promotion202309UpdateActivityProductRequestBodyProducts } from './promotion/V202309/UpdateActivityProductRequestBodyProducts';
import { Promotion202309UpdateActivityProductRequestBodyProductsSkus } from './promotion/V202309/UpdateActivityProductRequestBodyProductsSkus';
import { Promotion202309UpdateActivityProductResponse } from './promotion/V202309/UpdateActivityProductResponse';
import { Promotion202309UpdateActivityProductResponseData } from './promotion/V202309/UpdateActivityProductResponseData';
import { Promotion202309UpdateActivityRequestBody } from './promotion/V202309/UpdateActivityRequestBody';
import { Promotion202309UpdateActivityRequestBodyDiscount } from './promotion/V202309/UpdateActivityRequestBodyDiscount';
import { Promotion202309UpdateActivityRequestBodyDiscountBmsmDiscount } from './promotion/V202309/UpdateActivityRequestBodyDiscountBmsmDiscount';
import { Promotion202309UpdateActivityRequestBodyDiscountBmsmDiscountDetails } from './promotion/V202309/UpdateActivityRequestBodyDiscountBmsmDiscountDetails';
import { Promotion202309UpdateActivityRequestBodyDiscountGiftDiscount } from './promotion/V202309/UpdateActivityRequestBodyDiscountGiftDiscount';
import { Promotion202309UpdateActivityRequestBodyDiscountGiftDiscountGiftInfos } from './promotion/V202309/UpdateActivityRequestBodyDiscountGiftDiscountGiftInfos';
import { Promotion202309UpdateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails } from './promotion/V202309/UpdateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails';
import { Promotion202309UpdateActivityRequestBodyDiscountShippingDiscount } from './promotion/V202309/UpdateActivityRequestBodyDiscountShippingDiscount';
import { Promotion202309UpdateActivityRequestBodyDiscountShippingDiscountAreaScope } from './promotion/V202309/UpdateActivityRequestBodyDiscountShippingDiscountAreaScope';
import { Promotion202309UpdateActivityRequestBodyParticipationLimit } from './promotion/V202309/UpdateActivityRequestBodyParticipationLimit';
import { Promotion202309UpdateActivityResponse } from './promotion/V202309/UpdateActivityResponse';
import { Promotion202309UpdateActivityResponseData } from './promotion/V202309/UpdateActivityResponseData';
import { Promotion202406GetCouponResponse } from './promotion/V202406/GetCouponResponse';
import { Promotion202406GetCouponResponseData } from './promotion/V202406/GetCouponResponseData';
import { Promotion202406GetCouponResponseDataCoupon } from './promotion/V202406/GetCouponResponseDataCoupon';
import { Promotion202406GetCouponResponseDataCouponClaimDuration } from './promotion/V202406/GetCouponResponseDataCouponClaimDuration';
import { Promotion202406GetCouponResponseDataCouponDiscount } from './promotion/V202406/GetCouponResponseDataCouponDiscount';
import { Promotion202406GetCouponResponseDataCouponDiscountMaxDiscount } from './promotion/V202406/GetCouponResponseDataCouponDiscountMaxDiscount';
import { Promotion202406GetCouponResponseDataCouponDiscountReductionAmount } from './promotion/V202406/GetCouponResponseDataCouponDiscountReductionAmount';
import { Promotion202406GetCouponResponseDataCouponLiveTasks } from './promotion/V202406/GetCouponResponseDataCouponLiveTasks';
import { Promotion202406GetCouponResponseDataCouponRedemptionDuration } from './promotion/V202406/GetCouponResponseDataCouponRedemptionDuration';
import { Promotion202406GetCouponResponseDataCouponThreshold } from './promotion/V202406/GetCouponResponseDataCouponThreshold';
import { Promotion202406GetCouponResponseDataCouponThresholdMinSpend } from './promotion/V202406/GetCouponResponseDataCouponThresholdMinSpend';
import { Promotion202406GetCouponResponseDataCouponUsageLimits } from './promotion/V202406/GetCouponResponseDataCouponUsageLimits';
import { Promotion202406GetCouponResponseDataCouponUsageStats } from './promotion/V202406/GetCouponResponseDataCouponUsageStats';
import { Promotion202406SearchCouponsRequestBody } from './promotion/V202406/SearchCouponsRequestBody';
import { Promotion202406SearchCouponsResponse } from './promotion/V202406/SearchCouponsResponse';
import { Promotion202406SearchCouponsResponseData } from './promotion/V202406/SearchCouponsResponseData';
import { Promotion202406SearchCouponsResponseDataCoupons } from './promotion/V202406/SearchCouponsResponseDataCoupons';
import { Promotion202406SearchCouponsResponseDataCouponsClaimDuration } from './promotion/V202406/SearchCouponsResponseDataCouponsClaimDuration';
import { Promotion202406SearchCouponsResponseDataCouponsDiscount } from './promotion/V202406/SearchCouponsResponseDataCouponsDiscount';
import { Promotion202406SearchCouponsResponseDataCouponsDiscountMaxDiscount } from './promotion/V202406/SearchCouponsResponseDataCouponsDiscountMaxDiscount';
import { Promotion202406SearchCouponsResponseDataCouponsDiscountReductionAmount } from './promotion/V202406/SearchCouponsResponseDataCouponsDiscountReductionAmount';
import { Promotion202406SearchCouponsResponseDataCouponsRedemptionDuration } from './promotion/V202406/SearchCouponsResponseDataCouponsRedemptionDuration';
import { Promotion202406SearchCouponsResponseDataCouponsThreshold } from './promotion/V202406/SearchCouponsResponseDataCouponsThreshold';
import { Promotion202406SearchCouponsResponseDataCouponsThresholdMinSpend } from './promotion/V202406/SearchCouponsResponseDataCouponsThresholdMinSpend';
import { Promotion202406SearchCouponsResponseDataCouponsUsageLimits } from './promotion/V202406/SearchCouponsResponseDataCouponsUsageLimits';
import { ReturnRefund202309ApproveCancellationResponse } from './returnRefund/V202309/ApproveCancellationResponse';
import { ReturnRefund202309ApproveReturnRequestBody } from './returnRefund/V202309/ApproveReturnRequestBody';
import { ReturnRefund202309ApproveReturnRequestBodyPartialRefund } from './returnRefund/V202309/ApproveReturnRequestBodyPartialRefund';
import { ReturnRefund202309ApproveReturnResponse } from './returnRefund/V202309/ApproveReturnResponse';
import { ReturnRefund202309CalculateRefundRequestBody } from './returnRefund/V202309/CalculateRefundRequestBody';
import { ReturnRefund202309CalculateRefundRequestBodySkus } from './returnRefund/V202309/CalculateRefundRequestBodySkus';
import { ReturnRefund202309CalculateRefundResponse } from './returnRefund/V202309/CalculateRefundResponse';
import { ReturnRefund202309CalculateRefundResponseData } from './returnRefund/V202309/CalculateRefundResponseData';
import { ReturnRefund202309CalculateRefundResponseDataOrderRefundAmount } from './returnRefund/V202309/CalculateRefundResponseDataOrderRefundAmount';
import { ReturnRefund202309CancelOrderRequestBody } from './returnRefund/V202309/CancelOrderRequestBody';
import { ReturnRefund202309CancelOrderRequestBodySkus } from './returnRefund/V202309/CancelOrderRequestBodySkus';
import { ReturnRefund202309CancelOrderResponse } from './returnRefund/V202309/CancelOrderResponse';
import { ReturnRefund202309CancelOrderResponseData } from './returnRefund/V202309/CancelOrderResponseData';
import { ReturnRefund202309CreateReturnRequestBody } from './returnRefund/V202309/CreateReturnRequestBody';
import { ReturnRefund202309CreateReturnRequestBodySkus } from './returnRefund/V202309/CreateReturnRequestBodySkus';
import { ReturnRefund202309CreateReturnResponse } from './returnRefund/V202309/CreateReturnResponse';
import { ReturnRefund202309CreateReturnResponseData } from './returnRefund/V202309/CreateReturnResponseData';
import { ReturnRefund202309GetAftersaleEligibilityResponse } from './returnRefund/V202309/GetAftersaleEligibilityResponse';
import { ReturnRefund202309GetAftersaleEligibilityResponseData } from './returnRefund/V202309/GetAftersaleEligibilityResponseData';
import { ReturnRefund202309GetAftersaleEligibilityResponseDataSkuEligibility } from './returnRefund/V202309/GetAftersaleEligibilityResponseDataSkuEligibility';
import { ReturnRefund202309GetAftersaleEligibilityResponseDataSkuEligibilityLineItemEligibility } from './returnRefund/V202309/GetAftersaleEligibilityResponseDataSkuEligibilityLineItemEligibility';
import { ReturnRefund202309GetRejectReasonsResponse } from './returnRefund/V202309/GetRejectReasonsResponse';
import { ReturnRefund202309GetRejectReasonsResponseData } from './returnRefund/V202309/GetRejectReasonsResponseData';
import { ReturnRefund202309GetRejectReasonsResponseDataReasons } from './returnRefund/V202309/GetRejectReasonsResponseDataReasons';
import { ReturnRefund202309GetReturnRecordsResponse } from './returnRefund/V202309/GetReturnRecordsResponse';
import { ReturnRefund202309GetReturnRecordsResponseData } from './returnRefund/V202309/GetReturnRecordsResponseData';
import { ReturnRefund202309GetReturnRecordsResponseDataRecords } from './returnRefund/V202309/GetReturnRecordsResponseDataRecords';
import { ReturnRefund202309GetReturnRecordsResponseDataRecordsImages } from './returnRefund/V202309/GetReturnRecordsResponseDataRecordsImages';
import { ReturnRefund202309GetReturnRecordsResponseDataRecordsVideos } from './returnRefund/V202309/GetReturnRecordsResponseDataRecordsVideos';
import { ReturnRefund202309RejectCancellationRequestBody } from './returnRefund/V202309/RejectCancellationRequestBody';
import { ReturnRefund202309RejectCancellationRequestBodyImages } from './returnRefund/V202309/RejectCancellationRequestBodyImages';
import { ReturnRefund202309RejectCancellationResponse } from './returnRefund/V202309/RejectCancellationResponse';
import { ReturnRefund202309RejectReturnRequestBody } from './returnRefund/V202309/RejectReturnRequestBody';
import { ReturnRefund202309RejectReturnRequestBodyImages } from './returnRefund/V202309/RejectReturnRequestBodyImages';
import { ReturnRefund202309RejectReturnResponse } from './returnRefund/V202309/RejectReturnResponse';
import { ReturnRefund202309SearchCancellationsRequestBody } from './returnRefund/V202309/SearchCancellationsRequestBody';
import { ReturnRefund202309SearchCancellationsResponse } from './returnRefund/V202309/SearchCancellationsResponse';
import { ReturnRefund202309SearchCancellationsResponseData } from './returnRefund/V202309/SearchCancellationsResponseData';
import { ReturnRefund202309SearchCancellationsResponseDataCancellations } from './returnRefund/V202309/SearchCancellationsResponseDataCancellations';
import { ReturnRefund202309SearchCancellationsResponseDataCancellationsCancelLineItems } from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsCancelLineItems';
import { ReturnRefund202309SearchCancellationsResponseDataCancellationsCancelLineItemsProductImage } from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsCancelLineItemsProductImage';
import { ReturnRefund202309SearchCancellationsResponseDataCancellationsCancelLineItemsRefundAmount } from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsCancelLineItemsRefundAmount';
import { ReturnRefund202309SearchCancellationsResponseDataCancellationsRefundAmount } from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsRefundAmount';
import { ReturnRefund202309SearchCancellationsResponseDataCancellationsSellerNextActionResponse } from './returnRefund/V202309/SearchCancellationsResponseDataCancellationsSellerNextActionResponse';
import { ReturnRefund202309SearchReturnsRequestBody } from './returnRefund/V202309/SearchReturnsRequestBody';
import { ReturnRefund202309SearchReturnsResponse } from './returnRefund/V202309/SearchReturnsResponse';
import { ReturnRefund202309SearchReturnsResponseData } from './returnRefund/V202309/SearchReturnsResponseData';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrders } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrders';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrdersDiscountAmount } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersDiscountAmount';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrdersPartialRefund } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersPartialRefund';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrdersRefundAmount } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersRefundAmount';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnLineItems } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersReturnLineItems';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnLineItemsProductImage } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersReturnLineItemsProductImage';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnLineItemsRefundAmount } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersReturnLineItemsRefundAmount';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnWarehouseAddress } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersReturnWarehouseAddress';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrdersSellerNextActionResponse } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersSellerNextActionResponse';
import { ReturnRefund202309SearchReturnsResponseDataReturnOrdersShippingFeeAmount } from './returnRefund/V202309/SearchReturnsResponseDataReturnOrdersShippingFeeAmount';
import { Seller202309GetActiveShopsResponse } from './seller/V202309/GetActiveShopsResponse';
import { Seller202309GetActiveShopsResponseData } from './seller/V202309/GetActiveShopsResponseData';
import { Seller202309GetActiveShopsResponseDataShops } from './seller/V202309/GetActiveShopsResponseDataShops';
import { Seller202309GetSellerPermissionsResponse } from './seller/V202309/GetSellerPermissionsResponse';
import { Seller202309GetSellerPermissionsResponseData } from './seller/V202309/GetSellerPermissionsResponseData';
import { SupplyChain202309ConfirmPackageShipmentRequestBody } from './supplyChain/V202309/ConfirmPackageShipmentRequestBody';
import { SupplyChain202309ConfirmPackageShipmentRequestBodyPackages } from './supplyChain/V202309/ConfirmPackageShipmentRequestBodyPackages';
import { SupplyChain202309ConfirmPackageShipmentRequestBodyPackagesDimension } from './supplyChain/V202309/ConfirmPackageShipmentRequestBodyPackagesDimension';
import { SupplyChain202309ConfirmPackageShipmentRequestBodyPackagesSkus } from './supplyChain/V202309/ConfirmPackageShipmentRequestBodyPackagesSkus';
import { SupplyChain202309ConfirmPackageShipmentRequestBodyPackagesWeight } from './supplyChain/V202309/ConfirmPackageShipmentRequestBodyPackagesWeight';
import { SupplyChain202309ConfirmPackageShipmentResponse } from './supplyChain/V202309/ConfirmPackageShipmentResponse';
import { SupplyChain202309ConfirmPackageShipmentResponseData } from './supplyChain/V202309/ConfirmPackageShipmentResponseData';
import { SupplyChain202309ConfirmPackageShipmentResponseDataErrors } from './supplyChain/V202309/ConfirmPackageShipmentResponseDataErrors';
import { SupplyChain202309ConfirmPackageShipmentResponseDataErrorsDetail } from './supplyChain/V202309/ConfirmPackageShipmentResponseDataErrorsDetail';

/* tslint:disable:no-unused-variable */
let primitives = [
                    "string",
                    "boolean",
                    "double",
                    "integer",
                    "long",
                    "float",
                    "number",
                    "any"
                 ];

let enumsMap: {[index: string]: any} = {
}

let typeMap: {[index: string]: any} = {
    "Authorization202309GetAuthorizedShopsResponse": Authorization202309GetAuthorizedShopsResponse,
    "Authorization202309GetAuthorizedShopsResponseData": Authorization202309GetAuthorizedShopsResponseData,
    "Authorization202309GetAuthorizedShopsResponseDataShops": Authorization202309GetAuthorizedShopsResponseDataShops,
    "Authorization202312GetWidgetTokenResponse": Authorization202312GetWidgetTokenResponse,
    "Authorization202312GetWidgetTokenResponseData": Authorization202312GetWidgetTokenResponseData,
    "Authorization202312GetWidgetTokenResponseDataWidgetToken": Authorization202312GetWidgetTokenResponseDataWidgetToken,
    "Authorization202401GetWidgetTokenResponse": Authorization202401GetWidgetTokenResponse,
    "Authorization202401GetWidgetTokenResponseData": Authorization202401GetWidgetTokenResponseData,
    "Authorization202401GetWidgetTokenResponseDataWidgetToken": Authorization202401GetWidgetTokenResponseDataWidgetToken,
    "Authorization202403DeauthorizeShopResponse": Authorization202403DeauthorizeShopResponse,
    "CustomerService202309CreateConversationRequestBody": CustomerService202309CreateConversationRequestBody,
    "CustomerService202309CreateConversationResponse": CustomerService202309CreateConversationResponse,
    "CustomerService202309CreateConversationResponseData": CustomerService202309CreateConversationResponseData,
    "CustomerService202309GetAgentSettingsResponse": CustomerService202309GetAgentSettingsResponse,
    "CustomerService202309GetAgentSettingsResponseData": CustomerService202309GetAgentSettingsResponseData,
    "CustomerService202309GetConversationMessagesResponse": CustomerService202309GetConversationMessagesResponse,
    "CustomerService202309GetConversationMessagesResponseData": CustomerService202309GetConversationMessagesResponseData,
    "CustomerService202309GetConversationMessagesResponseDataMessages": CustomerService202309GetConversationMessagesResponseDataMessages,
    "CustomerService202309GetConversationMessagesResponseDataMessagesSender": CustomerService202309GetConversationMessagesResponseDataMessagesSender,
    "CustomerService202309GetConversationsResponse": CustomerService202309GetConversationsResponse,
    "CustomerService202309GetConversationsResponseData": CustomerService202309GetConversationsResponseData,
    "CustomerService202309GetConversationsResponseDataConversations": CustomerService202309GetConversationsResponseDataConversations,
    "CustomerService202309GetConversationsResponseDataConversationsLatestMessage": CustomerService202309GetConversationsResponseDataConversationsLatestMessage,
    "CustomerService202309GetConversationsResponseDataConversationsLatestMessageSender": CustomerService202309GetConversationsResponseDataConversationsLatestMessageSender,
    "CustomerService202309GetConversationsResponseDataConversationsParticipants": CustomerService202309GetConversationsResponseDataConversationsParticipants,
    "CustomerService202309ReadMessageResponse": CustomerService202309ReadMessageResponse,
    "CustomerService202309SendMessageRequestBody": CustomerService202309SendMessageRequestBody,
    "CustomerService202309SendMessageResponse": CustomerService202309SendMessageResponse,
    "CustomerService202309SendMessageResponseData": CustomerService202309SendMessageResponseData,
    "CustomerService202309UpdateAgentSettingsRequestBody": CustomerService202309UpdateAgentSettingsRequestBody,
    "CustomerService202309UpdateAgentSettingsResponse": CustomerService202309UpdateAgentSettingsResponse,
    "CustomerService202309UploadBuyerMessagesImageResponse": CustomerService202309UploadBuyerMessagesImageResponse,
    "CustomerService202309UploadBuyerMessagesImageResponseData": CustomerService202309UploadBuyerMessagesImageResponseData,
    "CustomerService202407GetCustomerServicePerformanceResponse": CustomerService202407GetCustomerServicePerformanceResponse,
    "CustomerService202407GetCustomerServicePerformanceResponseData": CustomerService202407GetCustomerServicePerformanceResponseData,
    "CustomerService202407GetCustomerServicePerformanceResponseDataPerformance": CustomerService202407GetCustomerServicePerformanceResponseDataPerformance,
    "DataReconciliation202309OrderStatusDataExchangeRequestBody": DataReconciliation202309OrderStatusDataExchangeRequestBody,
    "DataReconciliation202309OrderStatusDataExchangeRequestBodyOrders": DataReconciliation202309OrderStatusDataExchangeRequestBodyOrders,
    "DataReconciliation202309OrderStatusDataExchangeRequestBodyOrdersPackages": DataReconciliation202309OrderStatusDataExchangeRequestBodyOrdersPackages,
    "DataReconciliation202309OrderStatusDataExchangeResponse": DataReconciliation202309OrderStatusDataExchangeResponse,
    "DataReconciliation202309OrderStatusDataExchangeResponseData": DataReconciliation202309OrderStatusDataExchangeResponseData,
    "DataReconciliation202309OrderStatusDataExchangeResponseDataErrors": DataReconciliation202309OrderStatusDataExchangeResponseDataErrors,
    "DataReconciliation202309OrderStatusDataExchangeResponseDataErrorsDetail": DataReconciliation202309OrderStatusDataExchangeResponseDataErrorsDetail,
    "DataReconciliation202309OrderStatusDataExchangeResponseDataErrorsDetailExtraErrors": DataReconciliation202309OrderStatusDataExchangeResponseDataErrorsDetailExtraErrors,
    "DataReconciliation202310QualityFactoryOrderDataImportAPIRequestBody": DataReconciliation202310QualityFactoryOrderDataImportAPIRequestBody,
    "DataReconciliation202310QualityFactoryOrderDataImportAPIRequestBodyOrders": DataReconciliation202310QualityFactoryOrderDataImportAPIRequestBodyOrders,
    "DataReconciliation202310QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages": DataReconciliation202310QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages,
    "DataReconciliation202310QualityFactoryOrderDataImportAPIResponse": DataReconciliation202310QualityFactoryOrderDataImportAPIResponse,
    "DataReconciliation202310QualityFactoryOrderDataImportAPIResponseData": DataReconciliation202310QualityFactoryOrderDataImportAPIResponseData,
    "DataReconciliation202310QualityFactoryOrderDataImportAPIResponseDataErrors": DataReconciliation202310QualityFactoryOrderDataImportAPIResponseDataErrors,
    "DataReconciliation202310QualityFactoryOrderDataImportAPIResponseDataErrorsDetail": DataReconciliation202310QualityFactoryOrderDataImportAPIResponseDataErrorsDetail,
    "DataReconciliation202310QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors": DataReconciliation202310QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors,
    "DataReconciliation202401QualityFactoryOrderDataImportAPIRequestBody": DataReconciliation202401QualityFactoryOrderDataImportAPIRequestBody,
    "DataReconciliation202401QualityFactoryOrderDataImportAPIRequestBodyOrders": DataReconciliation202401QualityFactoryOrderDataImportAPIRequestBodyOrders,
    "DataReconciliation202401QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages": DataReconciliation202401QualityFactoryOrderDataImportAPIRequestBodyOrdersPackages,
    "DataReconciliation202401QualityFactoryOrderDataImportAPIResponse": DataReconciliation202401QualityFactoryOrderDataImportAPIResponse,
    "DataReconciliation202401QualityFactoryOrderDataImportAPIResponseData": DataReconciliation202401QualityFactoryOrderDataImportAPIResponseData,
    "DataReconciliation202401QualityFactoryOrderDataImportAPIResponseDataErrors": DataReconciliation202401QualityFactoryOrderDataImportAPIResponseDataErrors,
    "DataReconciliation202401QualityFactoryOrderDataImportAPIResponseDataErrorsDetail": DataReconciliation202401QualityFactoryOrderDataImportAPIResponseDataErrorsDetail,
    "DataReconciliation202401QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors": DataReconciliation202401QualityFactoryOrderDataImportAPIResponseDataErrorsDetailExtraErrors,
    "Event202309DeleteShopWebhookRequestBody": Event202309DeleteShopWebhookRequestBody,
    "Event202309DeleteShopWebhookResponse": Event202309DeleteShopWebhookResponse,
    "Event202309GetShopWebhooksResponse": Event202309GetShopWebhooksResponse,
    "Event202309GetShopWebhooksResponseData": Event202309GetShopWebhooksResponseData,
    "Event202309GetShopWebhooksResponseDataWebhooks": Event202309GetShopWebhooksResponseDataWebhooks,
    "Event202309UpdateShopWebhookRequestBody": Event202309UpdateShopWebhookRequestBody,
    "Event202309UpdateShopWebhookResponse": Event202309UpdateShopWebhookResponse,
    "Finance202309GetPaymentsResponse": Finance202309GetPaymentsResponse,
    "Finance202309GetPaymentsResponseData": Finance202309GetPaymentsResponseData,
    "Finance202309GetPaymentsResponseDataPayments": Finance202309GetPaymentsResponseDataPayments,
    "Finance202309GetPaymentsResponseDataPaymentsAmount": Finance202309GetPaymentsResponseDataPaymentsAmount,
    "Finance202309GetPaymentsResponseDataPaymentsPaymentAmountBeforeExchange": Finance202309GetPaymentsResponseDataPaymentsPaymentAmountBeforeExchange,
    "Finance202309GetPaymentsResponseDataPaymentsReserveAmount": Finance202309GetPaymentsResponseDataPaymentsReserveAmount,
    "Finance202309GetPaymentsResponseDataPaymentsSettlementAmount": Finance202309GetPaymentsResponseDataPaymentsSettlementAmount,
    "Finance202309GetStatementsResponse": Finance202309GetStatementsResponse,
    "Finance202309GetStatementsResponseData": Finance202309GetStatementsResponseData,
    "Finance202309GetStatementsResponseDataStatements": Finance202309GetStatementsResponseDataStatements,
    "Finance202309GetTransactionsbyOrderResponse": Finance202309GetTransactionsbyOrderResponse,
    "Finance202309GetTransactionsbyOrderResponseData": Finance202309GetTransactionsbyOrderResponseData,
    "Finance202309GetTransactionsbyOrderResponseDataStatementTransactions": Finance202309GetTransactionsbyOrderResponseDataStatementTransactions,
    "Finance202309GetTransactionsbyOrderResponseDataStatementTransactionsSkuStatementTransactions": Finance202309GetTransactionsbyOrderResponseDataStatementTransactionsSkuStatementTransactions,
    "Finance202309GetTransactionsbyStatementResponse": Finance202309GetTransactionsbyStatementResponse,
    "Finance202309GetTransactionsbyStatementResponseData": Finance202309GetTransactionsbyStatementResponseData,
    "Finance202309GetTransactionsbyStatementResponseDataStatementTransactions": Finance202309GetTransactionsbyStatementResponseDataStatementTransactions,
    "Finance202309GetWithdrawalsResponse": Finance202309GetWithdrawalsResponse,
    "Finance202309GetWithdrawalsResponseData": Finance202309GetWithdrawalsResponseData,
    "Finance202309GetWithdrawalsResponseDataWithdrawals": Finance202309GetWithdrawalsResponseDataWithdrawals,
    "Finance202501GetTransactionsbyOrderResponse": Finance202501GetTransactionsbyOrderResponse,
    "Finance202501GetTransactionsbyOrderResponseData": Finance202501GetTransactionsbyOrderResponseData,
    "Finance202501GetTransactionsbyOrderResponseDataSkuTransactions": Finance202501GetTransactionsbyOrderResponseDataSkuTransactions,
    "Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdown": Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdown,
    "Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownFee": Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownFee,
    "Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownTax": Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsFeeTaxBreakdownTax,
    "Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsRevenueBreakdown": Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsRevenueBreakdown,
    "Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdown": Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdown,
    "Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdownSupplementaryComponent": Finance202501GetTransactionsbyOrderResponseDataSkuTransactionsShippingCostBreakdownSupplementaryComponent,
    "Finance202501GetTransactionsbyStatementResponse": Finance202501GetTransactionsbyStatementResponse,
    "Finance202501GetTransactionsbyStatementResponseData": Finance202501GetTransactionsbyStatementResponseData,
    "Finance202501GetTransactionsbyStatementResponseDataTotalSettlementBreakdown": Finance202501GetTransactionsbyStatementResponseDataTotalSettlementBreakdown,
    "Finance202501GetTransactionsbyStatementResponseDataTransactions": Finance202501GetTransactionsbyStatementResponseDataTransactions,
    "Finance202501GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdown": Finance202501GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdown,
    "Finance202501GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownFee": Finance202501GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownFee,
    "Finance202501GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownTax": Finance202501GetTransactionsbyStatementResponseDataTransactionsFeeTaxBreakdownTax,
    "Finance202501GetTransactionsbyStatementResponseDataTransactionsRevenueBreakdown": Finance202501GetTransactionsbyStatementResponseDataTransactionsRevenueBreakdown,
    "Finance202501GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdown": Finance202501GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdown,
    "Finance202501GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdownSupplementaryComponent": Finance202501GetTransactionsbyStatementResponseDataTransactionsShippingCostBreakdownSupplementaryComponent,
    "Finance202501GetTransactionsbyStatementResponseDataTransactionsSupplementaryComponent": Finance202501GetTransactionsbyStatementResponseDataTransactionsSupplementaryComponent,
    "Finance202506GetSellerunsettledtransactionResponse": Finance202506GetSellerunsettledtransactionResponse,
    "Finance202506GetSellerunsettledtransactionResponseData": Finance202506GetSellerunsettledtransactionResponseData,
    "Finance202506GetSellerunsettledtransactionResponseDataTransactions": Finance202506GetSellerunsettledtransactionResponseDataTransactions,
    "Finance202506GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdown": Finance202506GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdown,
    "Finance202506GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownFee": Finance202506GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownFee,
    "Finance202506GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownTax": Finance202506GetSellerunsettledtransactionResponseDataTransactionsFeeTaxBreakdownTax,
    "Finance202506GetSellerunsettledtransactionResponseDataTransactionsRevenueBreakdown": Finance202506GetSellerunsettledtransactionResponseDataTransactionsRevenueBreakdown,
    "Finance202506GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdown": Finance202506GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdown,
    "Finance202506GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdownSupplementaryComponent": Finance202506GetSellerunsettledtransactionResponseDataTransactionsShippingCostBreakdownSupplementaryComponent,
    "Fulfillment202309BatchShipPackagesRequestBody": Fulfillment202309BatchShipPackagesRequestBody,
    "Fulfillment202309BatchShipPackagesRequestBodyPackages": Fulfillment202309BatchShipPackagesRequestBodyPackages,
    "Fulfillment202309BatchShipPackagesRequestBodyPackagesPickupSlot": Fulfillment202309BatchShipPackagesRequestBodyPackagesPickupSlot,
    "Fulfillment202309BatchShipPackagesRequestBodyPackagesSelfShipment": Fulfillment202309BatchShipPackagesRequestBodyPackagesSelfShipment,
    "Fulfillment202309BatchShipPackagesResponse": Fulfillment202309BatchShipPackagesResponse,
    "Fulfillment202309BatchShipPackagesResponseData": Fulfillment202309BatchShipPackagesResponseData,
    "Fulfillment202309BatchShipPackagesResponseDataErrors": Fulfillment202309BatchShipPackagesResponseDataErrors,
    "Fulfillment202309BatchShipPackagesResponseDataErrorsDetail": Fulfillment202309BatchShipPackagesResponseDataErrorsDetail,
    "Fulfillment202309CombinePackageRequestBody": Fulfillment202309CombinePackageRequestBody,
    "Fulfillment202309CombinePackageRequestBodyCombinablePackages": Fulfillment202309CombinePackageRequestBodyCombinablePackages,
    "Fulfillment202309CombinePackageResponse": Fulfillment202309CombinePackageResponse,
    "Fulfillment202309CombinePackageResponseData": Fulfillment202309CombinePackageResponseData,
    "Fulfillment202309CombinePackageResponseDataErrors": Fulfillment202309CombinePackageResponseDataErrors,
    "Fulfillment202309CombinePackageResponseDataErrorsDetail": Fulfillment202309CombinePackageResponseDataErrorsDetail,
    "Fulfillment202309CombinePackageResponseDataPackages": Fulfillment202309CombinePackageResponseDataPackages,
    "Fulfillment202309CreatePackagesRequestBody": Fulfillment202309CreatePackagesRequestBody,
    "Fulfillment202309CreatePackagesRequestBodyDimension": Fulfillment202309CreatePackagesRequestBodyDimension,
    "Fulfillment202309CreatePackagesRequestBodyWeight": Fulfillment202309CreatePackagesRequestBodyWeight,
    "Fulfillment202309CreatePackagesResponse": Fulfillment202309CreatePackagesResponse,
    "Fulfillment202309CreatePackagesResponseData": Fulfillment202309CreatePackagesResponseData,
    "Fulfillment202309CreatePackagesResponseDataDimension": Fulfillment202309CreatePackagesResponseDataDimension,
    "Fulfillment202309CreatePackagesResponseDataShippingServiceInfo": Fulfillment202309CreatePackagesResponseDataShippingServiceInfo,
    "Fulfillment202309CreatePackagesResponseDataWeight": Fulfillment202309CreatePackagesResponseDataWeight,
    "Fulfillment202309FulfillmentUploadDeliveryFileResponse": Fulfillment202309FulfillmentUploadDeliveryFileResponse,
    "Fulfillment202309FulfillmentUploadDeliveryFileResponseData": Fulfillment202309FulfillmentUploadDeliveryFileResponseData,
    "Fulfillment202309FulfillmentUploadDeliveryImageResponse": Fulfillment202309FulfillmentUploadDeliveryImageResponse,
    "Fulfillment202309FulfillmentUploadDeliveryImageResponseData": Fulfillment202309FulfillmentUploadDeliveryImageResponseData,
    "Fulfillment202309GetEligibleShippingServiceRequestBody": Fulfillment202309GetEligibleShippingServiceRequestBody,
    "Fulfillment202309GetEligibleShippingServiceRequestBodyDimension": Fulfillment202309GetEligibleShippingServiceRequestBodyDimension,
    "Fulfillment202309GetEligibleShippingServiceRequestBodyWeight": Fulfillment202309GetEligibleShippingServiceRequestBodyWeight,
    "Fulfillment202309GetEligibleShippingServiceResponse": Fulfillment202309GetEligibleShippingServiceResponse,
    "Fulfillment202309GetEligibleShippingServiceResponseData": Fulfillment202309GetEligibleShippingServiceResponseData,
    "Fulfillment202309GetEligibleShippingServiceResponseDataDimension": Fulfillment202309GetEligibleShippingServiceResponseDataDimension,
    "Fulfillment202309GetEligibleShippingServiceResponseDataShippingServices": Fulfillment202309GetEligibleShippingServiceResponseDataShippingServices,
    "Fulfillment202309GetEligibleShippingServiceResponseDataWeight": Fulfillment202309GetEligibleShippingServiceResponseDataWeight,
    "Fulfillment202309GetHandoverTimeslotsResponse": Fulfillment202309GetHandoverTimeslotsResponse,
    "Fulfillment202309GetHandoverTimeslotsResponseData": Fulfillment202309GetHandoverTimeslotsResponseData,
    "Fulfillment202309GetHandoverTimeslotsResponseDataPickupSlots": Fulfillment202309GetHandoverTimeslotsResponseDataPickupSlots,
    "Fulfillment202309GetOrderSplitAttributesResponse": Fulfillment202309GetOrderSplitAttributesResponse,
    "Fulfillment202309GetOrderSplitAttributesResponseData": Fulfillment202309GetOrderSplitAttributesResponseData,
    "Fulfillment202309GetOrderSplitAttributesResponseDataSplitAttributes": Fulfillment202309GetOrderSplitAttributesResponseDataSplitAttributes,
    "Fulfillment202309GetOrderSplitAttributesResponseDataSplitAttributesMustSplitReasons": Fulfillment202309GetOrderSplitAttributesResponseDataSplitAttributesMustSplitReasons,
    "Fulfillment202309GetPackageDetailResponse": Fulfillment202309GetPackageDetailResponse,
    "Fulfillment202309GetPackageDetailResponseData": Fulfillment202309GetPackageDetailResponseData,
    "Fulfillment202309GetPackageDetailResponseDataDimension": Fulfillment202309GetPackageDetailResponseDataDimension,
    "Fulfillment202309GetPackageDetailResponseDataInsurance": Fulfillment202309GetPackageDetailResponseDataInsurance,
    "Fulfillment202309GetPackageDetailResponseDataOrders": Fulfillment202309GetPackageDetailResponseDataOrders,
    "Fulfillment202309GetPackageDetailResponseDataOrdersSkus": Fulfillment202309GetPackageDetailResponseDataOrdersSkus,
    "Fulfillment202309GetPackageDetailResponseDataPickupSlot": Fulfillment202309GetPackageDetailResponseDataPickupSlot,
    "Fulfillment202309GetPackageDetailResponseDataRecipientAddress": Fulfillment202309GetPackageDetailResponseDataRecipientAddress,
    "Fulfillment202309GetPackageDetailResponseDataSenderAddress": Fulfillment202309GetPackageDetailResponseDataSenderAddress,
    "Fulfillment202309GetPackageDetailResponseDataWeight": Fulfillment202309GetPackageDetailResponseDataWeight,
    "Fulfillment202309GetPackageHandoverTimeSlotsResponse": Fulfillment202309GetPackageHandoverTimeSlotsResponse,
    "Fulfillment202309GetPackageHandoverTimeSlotsResponseData": Fulfillment202309GetPackageHandoverTimeSlotsResponseData,
    "Fulfillment202309GetPackageHandoverTimeSlotsResponseDataPickupSlots": Fulfillment202309GetPackageHandoverTimeSlotsResponseDataPickupSlots,
    "Fulfillment202309GetPackageShippingDocumentResponse": Fulfillment202309GetPackageShippingDocumentResponse,
    "Fulfillment202309GetPackageShippingDocumentResponseData": Fulfillment202309GetPackageShippingDocumentResponseData,
    "Fulfillment202309GetTrackingResponse": Fulfillment202309GetTrackingResponse,
    "Fulfillment202309GetTrackingResponseData": Fulfillment202309GetTrackingResponseData,
    "Fulfillment202309GetTrackingResponseDataTracking": Fulfillment202309GetTrackingResponseDataTracking,
    "Fulfillment202309MarkPackageAsShippedRequestBody": Fulfillment202309MarkPackageAsShippedRequestBody,
    "Fulfillment202309MarkPackageAsShippedResponse": Fulfillment202309MarkPackageAsShippedResponse,
    "Fulfillment202309MarkPackageAsShippedResponseData": Fulfillment202309MarkPackageAsShippedResponseData,
    "Fulfillment202309MarkPackageAsShippedResponseDataWarning": Fulfillment202309MarkPackageAsShippedResponseDataWarning,
    "Fulfillment202309SchedulePackageHandoverRequestBody": Fulfillment202309SchedulePackageHandoverRequestBody,
    "Fulfillment202309SchedulePackageHandoverRequestBodyPickupSlot": Fulfillment202309SchedulePackageHandoverRequestBodyPickupSlot,
    "Fulfillment202309SchedulePackageHandoverResponse": Fulfillment202309SchedulePackageHandoverResponse,
    "Fulfillment202309SchedulePackageHandoverResponseData": Fulfillment202309SchedulePackageHandoverResponseData,
    "Fulfillment202309SchedulePackageHandoverResponseDataDimension": Fulfillment202309SchedulePackageHandoverResponseDataDimension,
    "Fulfillment202309SchedulePackageHandoverResponseDataWeight": Fulfillment202309SchedulePackageHandoverResponseDataWeight,
    "Fulfillment202309SearchCombinablePackagesResponse": Fulfillment202309SearchCombinablePackagesResponse,
    "Fulfillment202309SearchCombinablePackagesResponseData": Fulfillment202309SearchCombinablePackagesResponseData,
    "Fulfillment202309SearchCombinablePackagesResponseDataCombinablePackages": Fulfillment202309SearchCombinablePackagesResponseDataCombinablePackages,
    "Fulfillment202309SearchPackageRequestBody": Fulfillment202309SearchPackageRequestBody,
    "Fulfillment202309SearchPackageResponse": Fulfillment202309SearchPackageResponse,
    "Fulfillment202309SearchPackageResponseData": Fulfillment202309SearchPackageResponseData,
    "Fulfillment202309SearchPackageResponseDataPackages": Fulfillment202309SearchPackageResponseDataPackages,
    "Fulfillment202309SearchPackageResponseDataPackagesOrders": Fulfillment202309SearchPackageResponseDataPackagesOrders,
    "Fulfillment202309SearchPackageResponseDataPackagesOrdersSkus": Fulfillment202309SearchPackageResponseDataPackagesOrdersSkus,
    "Fulfillment202309ShipPackageRequestBody": Fulfillment202309ShipPackageRequestBody,
    "Fulfillment202309ShipPackageRequestBodyPickupSlot": Fulfillment202309ShipPackageRequestBodyPickupSlot,
    "Fulfillment202309ShipPackageRequestBodySelfShipment": Fulfillment202309ShipPackageRequestBodySelfShipment,
    "Fulfillment202309ShipPackageResponse": Fulfillment202309ShipPackageResponse,
    "Fulfillment202309SplitOrdersRequestBody": Fulfillment202309SplitOrdersRequestBody,
    "Fulfillment202309SplitOrdersRequestBodySplittableGroups": Fulfillment202309SplitOrdersRequestBodySplittableGroups,
    "Fulfillment202309SplitOrdersResponse": Fulfillment202309SplitOrdersResponse,
    "Fulfillment202309SplitOrdersResponseData": Fulfillment202309SplitOrdersResponseData,
    "Fulfillment202309SplitOrdersResponseDataPackages": Fulfillment202309SplitOrdersResponseDataPackages,
    "Fulfillment202309UncombinePackagesRequestBody": Fulfillment202309UncombinePackagesRequestBody,
    "Fulfillment202309UncombinePackagesResponse": Fulfillment202309UncombinePackagesResponse,
    "Fulfillment202309UncombinePackagesResponseData": Fulfillment202309UncombinePackagesResponseData,
    "Fulfillment202309UncombinePackagesResponseDataPackages": Fulfillment202309UncombinePackagesResponseDataPackages,
    "Fulfillment202309UpdatePackageDeliveryStatusRequestBody": Fulfillment202309UpdatePackageDeliveryStatusRequestBody,
    "Fulfillment202309UpdatePackageDeliveryStatusRequestBodyPackages": Fulfillment202309UpdatePackageDeliveryStatusRequestBodyPackages,
    "Fulfillment202309UpdatePackageDeliveryStatusResponse": Fulfillment202309UpdatePackageDeliveryStatusResponse,
    "Fulfillment202309UpdatePackageDeliveryStatusResponseData": Fulfillment202309UpdatePackageDeliveryStatusResponseData,
    "Fulfillment202309UpdatePackageDeliveryStatusResponseDataErrors": Fulfillment202309UpdatePackageDeliveryStatusResponseDataErrors,
    "Fulfillment202309UpdatePackageDeliveryStatusResponseDataErrorsDetail": Fulfillment202309UpdatePackageDeliveryStatusResponseDataErrorsDetail,
    "Fulfillment202309UpdatePackageShippingInfoRequestBody": Fulfillment202309UpdatePackageShippingInfoRequestBody,
    "Fulfillment202309UpdatePackageShippingInfoResponse": Fulfillment202309UpdatePackageShippingInfoResponse,
    "Fulfillment202309UpdateShippingInfoRequestBody": Fulfillment202309UpdateShippingInfoRequestBody,
    "Fulfillment202309UpdateShippingInfoResponse": Fulfillment202309UpdateShippingInfoResponse,
    "Fulfillment202407CreateFirstMileBundleRequestBody": Fulfillment202407CreateFirstMileBundleRequestBody,
    "Fulfillment202407CreateFirstMileBundleResponse": Fulfillment202407CreateFirstMileBundleResponse,
    "Fulfillment202407CreateFirstMileBundleResponseData": Fulfillment202407CreateFirstMileBundleResponseData,
    "Fulfillment202407CreateFirstMileBundleResponseDataErrors": Fulfillment202407CreateFirstMileBundleResponseDataErrors,
    "Fulfillment202407CreateFirstMileBundleResponseDataErrorsDetail": Fulfillment202407CreateFirstMileBundleResponseDataErrorsDetail,
    "Fulfillment202502UploadInvoiceRequestBody": Fulfillment202502UploadInvoiceRequestBody,
    "Fulfillment202502UploadInvoiceRequestBodyInvoices": Fulfillment202502UploadInvoiceRequestBodyInvoices,
    "Fulfillment202502UploadInvoiceResponse": Fulfillment202502UploadInvoiceResponse,
    "Fulfillment202502UploadInvoiceResponseData": Fulfillment202502UploadInvoiceResponseData,
    "Fulfillment202502UploadInvoiceResponseDataErrors": Fulfillment202502UploadInvoiceResponseDataErrors,
    "Fulfillment202502UploadInvoiceResponseDataErrorsDetail": Fulfillment202502UploadInvoiceResponseDataErrorsDetail,
    "Logistics202309GetGlobalSellerWarehouseResponse": Logistics202309GetGlobalSellerWarehouseResponse,
    "Logistics202309GetGlobalSellerWarehouseResponseData": Logistics202309GetGlobalSellerWarehouseResponseData,
    "Logistics202309GetGlobalSellerWarehouseResponseDataGlobalWarehouses": Logistics202309GetGlobalSellerWarehouseResponseDataGlobalWarehouses,
    "Logistics202309GetShippingProvidersResponse": Logistics202309GetShippingProvidersResponse,
    "Logistics202309GetShippingProvidersResponseData": Logistics202309GetShippingProvidersResponseData,
    "Logistics202309GetShippingProvidersResponseDataShippingProviders": Logistics202309GetShippingProvidersResponseDataShippingProviders,
    "Logistics202309GetWarehouseDeliveryOptionsResponse": Logistics202309GetWarehouseDeliveryOptionsResponse,
    "Logistics202309GetWarehouseDeliveryOptionsResponseData": Logistics202309GetWarehouseDeliveryOptionsResponseData,
    "Logistics202309GetWarehouseDeliveryOptionsResponseDataDeliveryOptions": Logistics202309GetWarehouseDeliveryOptionsResponseDataDeliveryOptions,
    "Logistics202309GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsDimensionLimit": Logistics202309GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsDimensionLimit,
    "Logistics202309GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsWeightLimit": Logistics202309GetWarehouseDeliveryOptionsResponseDataDeliveryOptionsWeightLimit,
    "Logistics202309GetWarehouseListResponse": Logistics202309GetWarehouseListResponse,
    "Logistics202309GetWarehouseListResponseData": Logistics202309GetWarehouseListResponseData,
    "Logistics202309GetWarehouseListResponseDataWarehouses": Logistics202309GetWarehouseListResponseDataWarehouses,
    "Logistics202309GetWarehouseListResponseDataWarehousesAddress": Logistics202309GetWarehouseListResponseDataWarehousesAddress,
    "Logistics202309GetWarehouseListResponseDataWarehousesAddressGeolocation": Logistics202309GetWarehouseListResponseDataWarehousesAddressGeolocation,
    "Order202309GetOrderDetailResponse": Order202309GetOrderDetailResponse,
    "Order202309GetOrderDetailResponseData": Order202309GetOrderDetailResponseData,
    "Order202309GetOrderDetailResponseDataOrders": Order202309GetOrderDetailResponseDataOrders,
    "Order202309GetOrderDetailResponseDataOrdersHandlingDuration": Order202309GetOrderDetailResponseDataOrdersHandlingDuration,
    "Order202309GetOrderDetailResponseDataOrdersLineItems": Order202309GetOrderDetailResponseDataOrdersLineItems,
    "Order202309GetOrderDetailResponseDataOrdersLineItemsCombinedListingSkus": Order202309GetOrderDetailResponseDataOrdersLineItemsCombinedListingSkus,
    "Order202309GetOrderDetailResponseDataOrdersLineItemsItemTax": Order202309GetOrderDetailResponseDataOrdersLineItemsItemTax,
    "Order202309GetOrderDetailResponseDataOrdersPackages": Order202309GetOrderDetailResponseDataOrdersPackages,
    "Order202309GetOrderDetailResponseDataOrdersPayment": Order202309GetOrderDetailResponseDataOrdersPayment,
    "Order202309GetOrderDetailResponseDataOrdersRecipientAddress": Order202309GetOrderDetailResponseDataOrdersRecipientAddress,
    "Order202309GetOrderDetailResponseDataOrdersRecipientAddressDeliveryPreferences": Order202309GetOrderDetailResponseDataOrdersRecipientAddressDeliveryPreferences,
    "Order202309GetOrderDetailResponseDataOrdersRecipientAddressDistrictInfo": Order202309GetOrderDetailResponseDataOrdersRecipientAddressDistrictInfo,
    "Order202309GetOrderListRequestBody": Order202309GetOrderListRequestBody,
    "Order202309GetOrderListResponse": Order202309GetOrderListResponse,
    "Order202309GetOrderListResponseData": Order202309GetOrderListResponseData,
    "Order202309GetOrderListResponseDataOrders": Order202309GetOrderListResponseDataOrders,
    "Order202309GetOrderListResponseDataOrdersHandlingDuration": Order202309GetOrderListResponseDataOrdersHandlingDuration,
    "Order202309GetOrderListResponseDataOrdersLineItems": Order202309GetOrderListResponseDataOrdersLineItems,
    "Order202309GetOrderListResponseDataOrdersLineItemsCombinedListingSkus": Order202309GetOrderListResponseDataOrdersLineItemsCombinedListingSkus,
    "Order202309GetOrderListResponseDataOrdersLineItemsItemTax": Order202309GetOrderListResponseDataOrdersLineItemsItemTax,
    "Order202309GetOrderListResponseDataOrdersPackages": Order202309GetOrderListResponseDataOrdersPackages,
    "Order202309GetOrderListResponseDataOrdersPayment": Order202309GetOrderListResponseDataOrdersPayment,
    "Order202309GetOrderListResponseDataOrdersRecipientAddress": Order202309GetOrderListResponseDataOrdersRecipientAddress,
    "Order202309GetOrderListResponseDataOrdersRecipientAddressDeliveryPreferences": Order202309GetOrderListResponseDataOrdersRecipientAddressDeliveryPreferences,
    "Order202309GetOrderListResponseDataOrdersRecipientAddressDistrictInfo": Order202309GetOrderListResponseDataOrdersRecipientAddressDistrictInfo,
    "Order202407GetPriceDetailResponse": Order202407GetPriceDetailResponse,
    "Order202407GetPriceDetailResponseData": Order202407GetPriceDetailResponseData,
    "Order202407GetPriceDetailResponseDataLineItems": Order202407GetPriceDetailResponseDataLineItems,
    "Product202309ActivateProductRequestBody": Product202309ActivateProductRequestBody,
    "Product202309ActivateProductResponse": Product202309ActivateProductResponse,
    "Product202309ActivateProductResponseData": Product202309ActivateProductResponseData,
    "Product202309ActivateProductResponseDataErrors": Product202309ActivateProductResponseDataErrors,
    "Product202309ActivateProductResponseDataErrorsDetail": Product202309ActivateProductResponseDataErrorsDetail,
    "Product202309ActivateProductResponseDataErrorsDetailExtraErrors": Product202309ActivateProductResponseDataErrorsDetailExtraErrors,
    "Product202309CheckListingPrerequisitesResponse": Product202309CheckListingPrerequisitesResponse,
    "Product202309CheckListingPrerequisitesResponseData": Product202309CheckListingPrerequisitesResponseData,
    "Product202309CheckListingPrerequisitesResponseDataShop": Product202309CheckListingPrerequisitesResponseDataShop,
    "Product202309CheckListingPrerequisitesResponseDataShopGne": Product202309CheckListingPrerequisitesResponseDataShopGne,
    "Product202309CheckListingPrerequisitesResponseDataShopLogistics": Product202309CheckListingPrerequisitesResponseDataShopLogistics,
    "Product202309CheckProductListingRequestBody": Product202309CheckProductListingRequestBody,
    "Product202309CheckProductListingRequestBodyCertifications": Product202309CheckProductListingRequestBodyCertifications,
    "Product202309CheckProductListingRequestBodyCertificationsFiles": Product202309CheckProductListingRequestBodyCertificationsFiles,
    "Product202309CheckProductListingRequestBodyCertificationsImages": Product202309CheckProductListingRequestBodyCertificationsImages,
    "Product202309CheckProductListingRequestBodyMainImages": Product202309CheckProductListingRequestBodyMainImages,
    "Product202309CheckProductListingRequestBodyPackageDimensions": Product202309CheckProductListingRequestBodyPackageDimensions,
    "Product202309CheckProductListingRequestBodyPackageWeight": Product202309CheckProductListingRequestBodyPackageWeight,
    "Product202309CheckProductListingRequestBodyProductAttributes": Product202309CheckProductListingRequestBodyProductAttributes,
    "Product202309CheckProductListingRequestBodyProductAttributesValues": Product202309CheckProductListingRequestBodyProductAttributesValues,
    "Product202309CheckProductListingRequestBodySizeChart": Product202309CheckProductListingRequestBodySizeChart,
    "Product202309CheckProductListingRequestBodySizeChartImage": Product202309CheckProductListingRequestBodySizeChartImage,
    "Product202309CheckProductListingRequestBodySizeChartTemplate": Product202309CheckProductListingRequestBodySizeChartTemplate,
    "Product202309CheckProductListingRequestBodySkus": Product202309CheckProductListingRequestBodySkus,
    "Product202309CheckProductListingRequestBodySkusCombinedSkus": Product202309CheckProductListingRequestBodySkusCombinedSkus,
    "Product202309CheckProductListingRequestBodySkusExternalListPrices": Product202309CheckProductListingRequestBodySkusExternalListPrices,
    "Product202309CheckProductListingRequestBodySkusIdentifierCode": Product202309CheckProductListingRequestBodySkusIdentifierCode,
    "Product202309CheckProductListingRequestBodySkusInventory": Product202309CheckProductListingRequestBodySkusInventory,
    "Product202309CheckProductListingRequestBodySkusListPrice": Product202309CheckProductListingRequestBodySkusListPrice,
    "Product202309CheckProductListingRequestBodySkusPreSale": Product202309CheckProductListingRequestBodySkusPreSale,
    "Product202309CheckProductListingRequestBodySkusPreSaleFulfillmentType": Product202309CheckProductListingRequestBodySkusPreSaleFulfillmentType,
    "Product202309CheckProductListingRequestBodySkusPrice": Product202309CheckProductListingRequestBodySkusPrice,
    "Product202309CheckProductListingRequestBodySkusSalesAttributes": Product202309CheckProductListingRequestBodySkusSalesAttributes,
    "Product202309CheckProductListingRequestBodySkusSalesAttributesSkuImg": Product202309CheckProductListingRequestBodySkusSalesAttributesSkuImg,
    "Product202309CheckProductListingRequestBodySkusSalesAttributesSupplementarySkuImages": Product202309CheckProductListingRequestBodySkusSalesAttributesSupplementarySkuImages,
    "Product202309CheckProductListingRequestBodyVideo": Product202309CheckProductListingRequestBodyVideo,
    "Product202309CheckProductListingResponse": Product202309CheckProductListingResponse,
    "Product202309CheckProductListingResponseData": Product202309CheckProductListingResponseData,
    "Product202309CheckProductListingResponseDataDiagnoses": Product202309CheckProductListingResponseDataDiagnoses,
    "Product202309CheckProductListingResponseDataDiagnosesDiagnosisResults": Product202309CheckProductListingResponseDataDiagnosesDiagnosisResults,
    "Product202309CheckProductListingResponseDataDiagnosesSuggestions": Product202309CheckProductListingResponseDataDiagnosesSuggestions,
    "Product202309CheckProductListingResponseDataDiagnosesSuggestionsImages": Product202309CheckProductListingResponseDataDiagnosesSuggestionsImages,
    "Product202309CheckProductListingResponseDataDiagnosesSuggestionsSeoWords": Product202309CheckProductListingResponseDataDiagnosesSuggestionsSeoWords,
    "Product202309CheckProductListingResponseDataDiagnosesSuggestionsSmartTexts": Product202309CheckProductListingResponseDataDiagnosesSuggestionsSmartTexts,
    "Product202309CheckProductListingResponseDataFailReasons": Product202309CheckProductListingResponseDataFailReasons,
    "Product202309CheckProductListingResponseDataListingQuality": Product202309CheckProductListingResponseDataListingQuality,
    "Product202309CheckProductListingResponseDataWarnings": Product202309CheckProductListingResponseDataWarnings,
    "Product202309CreateCustomBrandsRequestBody": Product202309CreateCustomBrandsRequestBody,
    "Product202309CreateCustomBrandsResponse": Product202309CreateCustomBrandsResponse,
    "Product202309CreateCustomBrandsResponseData": Product202309CreateCustomBrandsResponseData,
    "Product202309CreateGlobalProductRequestBody": Product202309CreateGlobalProductRequestBody,
    "Product202309CreateGlobalProductRequestBodyCertifications": Product202309CreateGlobalProductRequestBodyCertifications,
    "Product202309CreateGlobalProductRequestBodyCertificationsFiles": Product202309CreateGlobalProductRequestBodyCertificationsFiles,
    "Product202309CreateGlobalProductRequestBodyCertificationsImages": Product202309CreateGlobalProductRequestBodyCertificationsImages,
    "Product202309CreateGlobalProductRequestBodyMainImages": Product202309CreateGlobalProductRequestBodyMainImages,
    "Product202309CreateGlobalProductRequestBodyManufacturer": Product202309CreateGlobalProductRequestBodyManufacturer,
    "Product202309CreateGlobalProductRequestBodyPackageDimensions": Product202309CreateGlobalProductRequestBodyPackageDimensions,
    "Product202309CreateGlobalProductRequestBodyPackageWeight": Product202309CreateGlobalProductRequestBodyPackageWeight,
    "Product202309CreateGlobalProductRequestBodyProductAttributes": Product202309CreateGlobalProductRequestBodyProductAttributes,
    "Product202309CreateGlobalProductRequestBodyProductAttributesValues": Product202309CreateGlobalProductRequestBodyProductAttributesValues,
    "Product202309CreateGlobalProductRequestBodySizeChart": Product202309CreateGlobalProductRequestBodySizeChart,
    "Product202309CreateGlobalProductRequestBodySizeChartImage": Product202309CreateGlobalProductRequestBodySizeChartImage,
    "Product202309CreateGlobalProductRequestBodySizeChartTemplate": Product202309CreateGlobalProductRequestBodySizeChartTemplate,
    "Product202309CreateGlobalProductRequestBodySkus": Product202309CreateGlobalProductRequestBodySkus,
    "Product202309CreateGlobalProductRequestBodySkusIdentifierCode": Product202309CreateGlobalProductRequestBodySkusIdentifierCode,
    "Product202309CreateGlobalProductRequestBodySkusInventory": Product202309CreateGlobalProductRequestBodySkusInventory,
    "Product202309CreateGlobalProductRequestBodySkusPrice": Product202309CreateGlobalProductRequestBodySkusPrice,
    "Product202309CreateGlobalProductRequestBodySkusSalesAttributes": Product202309CreateGlobalProductRequestBodySkusSalesAttributes,
    "Product202309CreateGlobalProductRequestBodySkusSalesAttributesSkuImg": Product202309CreateGlobalProductRequestBodySkusSalesAttributesSkuImg,
    "Product202309CreateGlobalProductRequestBodyVideo": Product202309CreateGlobalProductRequestBodyVideo,
    "Product202309CreateGlobalProductResponse": Product202309CreateGlobalProductResponse,
    "Product202309CreateGlobalProductResponseData": Product202309CreateGlobalProductResponseData,
    "Product202309CreateGlobalProductResponseDataGlobalSkus": Product202309CreateGlobalProductResponseDataGlobalSkus,
    "Product202309CreateGlobalProductResponseDataGlobalSkusSalesAttributes": Product202309CreateGlobalProductResponseDataGlobalSkusSalesAttributes,
    "Product202309CreateProductRequestBody": Product202309CreateProductRequestBody,
    "Product202309CreateProductRequestBodyCertifications": Product202309CreateProductRequestBodyCertifications,
    "Product202309CreateProductRequestBodyCertificationsFiles": Product202309CreateProductRequestBodyCertificationsFiles,
    "Product202309CreateProductRequestBodyCertificationsImages": Product202309CreateProductRequestBodyCertificationsImages,
    "Product202309CreateProductRequestBodyMainImages": Product202309CreateProductRequestBodyMainImages,
    "Product202309CreateProductRequestBodyPackageDimensions": Product202309CreateProductRequestBodyPackageDimensions,
    "Product202309CreateProductRequestBodyPackageWeight": Product202309CreateProductRequestBodyPackageWeight,
    "Product202309CreateProductRequestBodyProductAttributes": Product202309CreateProductRequestBodyProductAttributes,
    "Product202309CreateProductRequestBodyProductAttributesValues": Product202309CreateProductRequestBodyProductAttributesValues,
    "Product202309CreateProductRequestBodySizeChart": Product202309CreateProductRequestBodySizeChart,
    "Product202309CreateProductRequestBodySizeChartImage": Product202309CreateProductRequestBodySizeChartImage,
    "Product202309CreateProductRequestBodySizeChartTemplate": Product202309CreateProductRequestBodySizeChartTemplate,
    "Product202309CreateProductRequestBodySkus": Product202309CreateProductRequestBodySkus,
    "Product202309CreateProductRequestBodySkusCombinedSkus": Product202309CreateProductRequestBodySkusCombinedSkus,
    "Product202309CreateProductRequestBodySkusExternalListPrices": Product202309CreateProductRequestBodySkusExternalListPrices,
    "Product202309CreateProductRequestBodySkusIdentifierCode": Product202309CreateProductRequestBodySkusIdentifierCode,
    "Product202309CreateProductRequestBodySkusInventory": Product202309CreateProductRequestBodySkusInventory,
    "Product202309CreateProductRequestBodySkusListPrice": Product202309CreateProductRequestBodySkusListPrice,
    "Product202309CreateProductRequestBodySkusPreSale": Product202309CreateProductRequestBodySkusPreSale,
    "Product202309CreateProductRequestBodySkusPreSaleFulfillmentType": Product202309CreateProductRequestBodySkusPreSaleFulfillmentType,
    "Product202309CreateProductRequestBodySkusPrice": Product202309CreateProductRequestBodySkusPrice,
    "Product202309CreateProductRequestBodySkusSalesAttributes": Product202309CreateProductRequestBodySkusSalesAttributes,
    "Product202309CreateProductRequestBodySkusSalesAttributesSkuImg": Product202309CreateProductRequestBodySkusSalesAttributesSkuImg,
    "Product202309CreateProductRequestBodySkusSalesAttributesSupplementarySkuImages": Product202309CreateProductRequestBodySkusSalesAttributesSupplementarySkuImages,
    "Product202309CreateProductRequestBodyVideo": Product202309CreateProductRequestBodyVideo,
    "Product202309CreateProductResponse": Product202309CreateProductResponse,
    "Product202309CreateProductResponseData": Product202309CreateProductResponseData,
    "Product202309CreateProductResponseDataSkus": Product202309CreateProductResponseDataSkus,
    "Product202309CreateProductResponseDataSkusSalesAttributes": Product202309CreateProductResponseDataSkusSalesAttributes,
    "Product202309CreateProductResponseDataWarnings": Product202309CreateProductResponseDataWarnings,
    "Product202309DeactivateProductsRequestBody": Product202309DeactivateProductsRequestBody,
    "Product202309DeactivateProductsResponse": Product202309DeactivateProductsResponse,
    "Product202309DeactivateProductsResponseData": Product202309DeactivateProductsResponseData,
    "Product202309DeactivateProductsResponseDataErrors": Product202309DeactivateProductsResponseDataErrors,
    "Product202309DeactivateProductsResponseDataErrorsDetail": Product202309DeactivateProductsResponseDataErrorsDetail,
    "Product202309DeleteGlobalProductsRequestBody": Product202309DeleteGlobalProductsRequestBody,
    "Product202309DeleteGlobalProductsResponse": Product202309DeleteGlobalProductsResponse,
    "Product202309DeleteGlobalProductsResponseData": Product202309DeleteGlobalProductsResponseData,
    "Product202309DeleteGlobalProductsResponseDataErrors": Product202309DeleteGlobalProductsResponseDataErrors,
    "Product202309DeleteGlobalProductsResponseDataErrorsDetail": Product202309DeleteGlobalProductsResponseDataErrorsDetail,
    "Product202309DeleteProductsRequestBody": Product202309DeleteProductsRequestBody,
    "Product202309DeleteProductsResponse": Product202309DeleteProductsResponse,
    "Product202309DeleteProductsResponseData": Product202309DeleteProductsResponseData,
    "Product202309DeleteProductsResponseDataErrors": Product202309DeleteProductsResponseDataErrors,
    "Product202309DeleteProductsResponseDataErrorsDetail": Product202309DeleteProductsResponseDataErrorsDetail,
    "Product202309EditGlobalProductRequestBody": Product202309EditGlobalProductRequestBody,
    "Product202309EditGlobalProductRequestBodyCertifications": Product202309EditGlobalProductRequestBodyCertifications,
    "Product202309EditGlobalProductRequestBodyCertificationsFiles": Product202309EditGlobalProductRequestBodyCertificationsFiles,
    "Product202309EditGlobalProductRequestBodyCertificationsImages": Product202309EditGlobalProductRequestBodyCertificationsImages,
    "Product202309EditGlobalProductRequestBodyMainImages": Product202309EditGlobalProductRequestBodyMainImages,
    "Product202309EditGlobalProductRequestBodyManufacturer": Product202309EditGlobalProductRequestBodyManufacturer,
    "Product202309EditGlobalProductRequestBodyPackageDimensions": Product202309EditGlobalProductRequestBodyPackageDimensions,
    "Product202309EditGlobalProductRequestBodyPackageWeight": Product202309EditGlobalProductRequestBodyPackageWeight,
    "Product202309EditGlobalProductRequestBodyProductAttributes": Product202309EditGlobalProductRequestBodyProductAttributes,
    "Product202309EditGlobalProductRequestBodyProductAttributesValues": Product202309EditGlobalProductRequestBodyProductAttributesValues,
    "Product202309EditGlobalProductRequestBodySizeChart": Product202309EditGlobalProductRequestBodySizeChart,
    "Product202309EditGlobalProductRequestBodySizeChartImage": Product202309EditGlobalProductRequestBodySizeChartImage,
    "Product202309EditGlobalProductRequestBodySizeChartTemplate": Product202309EditGlobalProductRequestBodySizeChartTemplate,
    "Product202309EditGlobalProductRequestBodySkus": Product202309EditGlobalProductRequestBodySkus,
    "Product202309EditGlobalProductRequestBodySkusIdentifierCode": Product202309EditGlobalProductRequestBodySkusIdentifierCode,
    "Product202309EditGlobalProductRequestBodySkusInventory": Product202309EditGlobalProductRequestBodySkusInventory,
    "Product202309EditGlobalProductRequestBodySkusPrice": Product202309EditGlobalProductRequestBodySkusPrice,
    "Product202309EditGlobalProductRequestBodySkusSalePrices": Product202309EditGlobalProductRequestBodySkusSalePrices,
    "Product202309EditGlobalProductRequestBodySkusSalesAttributes": Product202309EditGlobalProductRequestBodySkusSalesAttributes,
    "Product202309EditGlobalProductRequestBodySkusSalesAttributesSkuImg": Product202309EditGlobalProductRequestBodySkusSalesAttributesSkuImg,
    "Product202309EditGlobalProductRequestBodyVideo": Product202309EditGlobalProductRequestBodyVideo,
    "Product202309EditGlobalProductResponse": Product202309EditGlobalProductResponse,
    "Product202309EditGlobalProductResponseData": Product202309EditGlobalProductResponseData,
    "Product202309EditGlobalProductResponseDataGlobalSkus": Product202309EditGlobalProductResponseDataGlobalSkus,
    "Product202309EditGlobalProductResponseDataGlobalSkusSalesAttributes": Product202309EditGlobalProductResponseDataGlobalSkusSalesAttributes,
    "Product202309EditGlobalProductResponseDataPublishResults": Product202309EditGlobalProductResponseDataPublishResults,
    "Product202309EditGlobalProductResponseDataPublishResultsFailReasons": Product202309EditGlobalProductResponseDataPublishResultsFailReasons,
    "Product202309EditProductRequestBody": Product202309EditProductRequestBody,
    "Product202309EditProductRequestBodyCertifications": Product202309EditProductRequestBodyCertifications,
    "Product202309EditProductRequestBodyCertificationsFiles": Product202309EditProductRequestBodyCertificationsFiles,
    "Product202309EditProductRequestBodyCertificationsImages": Product202309EditProductRequestBodyCertificationsImages,
    "Product202309EditProductRequestBodyMainImages": Product202309EditProductRequestBodyMainImages,
    "Product202309EditProductRequestBodyPackageDimensions": Product202309EditProductRequestBodyPackageDimensions,
    "Product202309EditProductRequestBodyPackageWeight": Product202309EditProductRequestBodyPackageWeight,
    "Product202309EditProductRequestBodyProductAttributes": Product202309EditProductRequestBodyProductAttributes,
    "Product202309EditProductRequestBodyProductAttributesValues": Product202309EditProductRequestBodyProductAttributesValues,
    "Product202309EditProductRequestBodySizeChart": Product202309EditProductRequestBodySizeChart,
    "Product202309EditProductRequestBodySizeChartImage": Product202309EditProductRequestBodySizeChartImage,
    "Product202309EditProductRequestBodySizeChartTemplate": Product202309EditProductRequestBodySizeChartTemplate,
    "Product202309EditProductRequestBodySkus": Product202309EditProductRequestBodySkus,
    "Product202309EditProductRequestBodySkusCombinedSkus": Product202309EditProductRequestBodySkusCombinedSkus,
    "Product202309EditProductRequestBodySkusExternalListPrices": Product202309EditProductRequestBodySkusExternalListPrices,
    "Product202309EditProductRequestBodySkusIdentifierCode": Product202309EditProductRequestBodySkusIdentifierCode,
    "Product202309EditProductRequestBodySkusInventory": Product202309EditProductRequestBodySkusInventory,
    "Product202309EditProductRequestBodySkusListPrice": Product202309EditProductRequestBodySkusListPrice,
    "Product202309EditProductRequestBodySkusPreSale": Product202309EditProductRequestBodySkusPreSale,
    "Product202309EditProductRequestBodySkusPreSaleFulfillmentType": Product202309EditProductRequestBodySkusPreSaleFulfillmentType,
    "Product202309EditProductRequestBodySkusPrice": Product202309EditProductRequestBodySkusPrice,
    "Product202309EditProductRequestBodySkusSalesAttributes": Product202309EditProductRequestBodySkusSalesAttributes,
    "Product202309EditProductRequestBodySkusSalesAttributesSkuImg": Product202309EditProductRequestBodySkusSalesAttributesSkuImg,
    "Product202309EditProductRequestBodySkusSalesAttributesSupplementarySkuImages": Product202309EditProductRequestBodySkusSalesAttributesSupplementarySkuImages,
    "Product202309EditProductRequestBodyVideo": Product202309EditProductRequestBodyVideo,
    "Product202309EditProductResponse": Product202309EditProductResponse,
    "Product202309EditProductResponseData": Product202309EditProductResponseData,
    "Product202309EditProductResponseDataAudit": Product202309EditProductResponseDataAudit,
    "Product202309EditProductResponseDataSkus": Product202309EditProductResponseDataSkus,
    "Product202309EditProductResponseDataSkusSalesAttributes": Product202309EditProductResponseDataSkusSalesAttributes,
    "Product202309EditProductResponseDataWarnings": Product202309EditProductResponseDataWarnings,
    "Product202309GetAttributesResponse": Product202309GetAttributesResponse,
    "Product202309GetAttributesResponseData": Product202309GetAttributesResponseData,
    "Product202309GetAttributesResponseDataAttributes": Product202309GetAttributesResponseDataAttributes,
    "Product202309GetAttributesResponseDataAttributesRequirementConditions": Product202309GetAttributesResponseDataAttributesRequirementConditions,
    "Product202309GetAttributesResponseDataAttributesValues": Product202309GetAttributesResponseDataAttributesValues,
    "Product202309GetBrandsResponse": Product202309GetBrandsResponse,
    "Product202309GetBrandsResponseData": Product202309GetBrandsResponseData,
    "Product202309GetBrandsResponseDataBrands": Product202309GetBrandsResponseDataBrands,
    "Product202309GetCategoriesResponse": Product202309GetCategoriesResponse,
    "Product202309GetCategoriesResponseData": Product202309GetCategoriesResponseData,
    "Product202309GetCategoriesResponseDataCategories": Product202309GetCategoriesResponseDataCategories,
    "Product202309GetCategoryRulesResponse": Product202309GetCategoryRulesResponse,
    "Product202309GetCategoryRulesResponseData": Product202309GetCategoryRulesResponseData,
    "Product202309GetCategoryRulesResponseDataCod": Product202309GetCategoryRulesResponseDataCod,
    "Product202309GetCategoryRulesResponseDataEpr": Product202309GetCategoryRulesResponseDataEpr,
    "Product202309GetCategoryRulesResponseDataManufacturer": Product202309GetCategoryRulesResponseDataManufacturer,
    "Product202309GetCategoryRulesResponseDataPackageDimension": Product202309GetCategoryRulesResponseDataPackageDimension,
    "Product202309GetCategoryRulesResponseDataProductCertifications": Product202309GetCategoryRulesResponseDataProductCertifications,
    "Product202309GetCategoryRulesResponseDataProductCertificationsExpirationDate": Product202309GetCategoryRulesResponseDataProductCertificationsExpirationDate,
    "Product202309GetCategoryRulesResponseDataProductCertificationsRequirementConditions": Product202309GetCategoryRulesResponseDataProductCertificationsRequirementConditions,
    "Product202309GetCategoryRulesResponseDataResponsiblePerson": Product202309GetCategoryRulesResponseDataResponsiblePerson,
    "Product202309GetCategoryRulesResponseDataSizeChart": Product202309GetCategoryRulesResponseDataSizeChart,
    "Product202309GetGlobalAttributesResponse": Product202309GetGlobalAttributesResponse,
    "Product202309GetGlobalAttributesResponseData": Product202309GetGlobalAttributesResponseData,
    "Product202309GetGlobalAttributesResponseDataAttributes": Product202309GetGlobalAttributesResponseDataAttributes,
    "Product202309GetGlobalAttributesResponseDataAttributesRequirementConditions": Product202309GetGlobalAttributesResponseDataAttributesRequirementConditions,
    "Product202309GetGlobalAttributesResponseDataAttributesValues": Product202309GetGlobalAttributesResponseDataAttributesValues,
    "Product202309GetGlobalCategoriesResponse": Product202309GetGlobalCategoriesResponse,
    "Product202309GetGlobalCategoriesResponseData": Product202309GetGlobalCategoriesResponseData,
    "Product202309GetGlobalCategoriesResponseDataCategories": Product202309GetGlobalCategoriesResponseDataCategories,
    "Product202309GetGlobalCategoryRulesResponse": Product202309GetGlobalCategoryRulesResponse,
    "Product202309GetGlobalCategoryRulesResponseData": Product202309GetGlobalCategoryRulesResponseData,
    "Product202309GetGlobalCategoryRulesResponseDataManufacturer": Product202309GetGlobalCategoryRulesResponseDataManufacturer,
    "Product202309GetGlobalCategoryRulesResponseDataProductCertifications": Product202309GetGlobalCategoryRulesResponseDataProductCertifications,
    "Product202309GetGlobalCategoryRulesResponseDataProductCertificationsRequirementConditions": Product202309GetGlobalCategoryRulesResponseDataProductCertificationsRequirementConditions,
    "Product202309GetGlobalCategoryRulesResponseDataResponsiblePerson": Product202309GetGlobalCategoryRulesResponseDataResponsiblePerson,
    "Product202309GetGlobalCategoryRulesResponseDataSizeChart": Product202309GetGlobalCategoryRulesResponseDataSizeChart,
    "Product202309GetGlobalProductResponse": Product202309GetGlobalProductResponse,
    "Product202309GetGlobalProductResponseData": Product202309GetGlobalProductResponseData,
    "Product202309GetGlobalProductResponseDataBrand": Product202309GetGlobalProductResponseDataBrand,
    "Product202309GetGlobalProductResponseDataCategory": Product202309GetGlobalProductResponseDataCategory,
    "Product202309GetGlobalProductResponseDataCertifications": Product202309GetGlobalProductResponseDataCertifications,
    "Product202309GetGlobalProductResponseDataCertificationsFiles": Product202309GetGlobalProductResponseDataCertificationsFiles,
    "Product202309GetGlobalProductResponseDataCertificationsImages": Product202309GetGlobalProductResponseDataCertificationsImages,
    "Product202309GetGlobalProductResponseDataMainImages": Product202309GetGlobalProductResponseDataMainImages,
    "Product202309GetGlobalProductResponseDataManufacturer": Product202309GetGlobalProductResponseDataManufacturer,
    "Product202309GetGlobalProductResponseDataPackageDimensions": Product202309GetGlobalProductResponseDataPackageDimensions,
    "Product202309GetGlobalProductResponseDataPackageWeight": Product202309GetGlobalProductResponseDataPackageWeight,
    "Product202309GetGlobalProductResponseDataProductAttributes": Product202309GetGlobalProductResponseDataProductAttributes,
    "Product202309GetGlobalProductResponseDataProductAttributesValues": Product202309GetGlobalProductResponseDataProductAttributesValues,
    "Product202309GetGlobalProductResponseDataProducts": Product202309GetGlobalProductResponseDataProducts,
    "Product202309GetGlobalProductResponseDataProductsSkuMappings": Product202309GetGlobalProductResponseDataProductsSkuMappings,
    "Product202309GetGlobalProductResponseDataProductsSkuMappingsSalesAttributeMappings": Product202309GetGlobalProductResponseDataProductsSkuMappingsSalesAttributeMappings,
    "Product202309GetGlobalProductResponseDataSizeChart": Product202309GetGlobalProductResponseDataSizeChart,
    "Product202309GetGlobalProductResponseDataSizeChartImage": Product202309GetGlobalProductResponseDataSizeChartImage,
    "Product202309GetGlobalProductResponseDataSizeChartTemplate": Product202309GetGlobalProductResponseDataSizeChartTemplate,
    "Product202309GetGlobalProductResponseDataSkus": Product202309GetGlobalProductResponseDataSkus,
    "Product202309GetGlobalProductResponseDataSkusIdentifierCode": Product202309GetGlobalProductResponseDataSkusIdentifierCode,
    "Product202309GetGlobalProductResponseDataSkusInventory": Product202309GetGlobalProductResponseDataSkusInventory,
    "Product202309GetGlobalProductResponseDataSkusPrice": Product202309GetGlobalProductResponseDataSkusPrice,
    "Product202309GetGlobalProductResponseDataSkusSalesAttributes": Product202309GetGlobalProductResponseDataSkusSalesAttributes,
    "Product202309GetGlobalProductResponseDataSkusSalesAttributesSkuImg": Product202309GetGlobalProductResponseDataSkusSalesAttributesSkuImg,
    "Product202309GetGlobalProductResponseDataVideo": Product202309GetGlobalProductResponseDataVideo,
    "Product202309GetProductResponse": Product202309GetProductResponse,
    "Product202309GetProductResponseData": Product202309GetProductResponseData,
    "Product202309GetProductResponseDataAudit": Product202309GetProductResponseDataAudit,
    "Product202309GetProductResponseDataAuditFailedReasons": Product202309GetProductResponseDataAuditFailedReasons,
    "Product202309GetProductResponseDataBrand": Product202309GetProductResponseDataBrand,
    "Product202309GetProductResponseDataCategoryChains": Product202309GetProductResponseDataCategoryChains,
    "Product202309GetProductResponseDataCertifications": Product202309GetProductResponseDataCertifications,
    "Product202309GetProductResponseDataCertificationsFiles": Product202309GetProductResponseDataCertificationsFiles,
    "Product202309GetProductResponseDataCertificationsImages": Product202309GetProductResponseDataCertificationsImages,
    "Product202309GetProductResponseDataDeliveryOptions": Product202309GetProductResponseDataDeliveryOptions,
    "Product202309GetProductResponseDataGlobalProductAssociation": Product202309GetProductResponseDataGlobalProductAssociation,
    "Product202309GetProductResponseDataGlobalProductAssociationSkuMappings": Product202309GetProductResponseDataGlobalProductAssociationSkuMappings,
    "Product202309GetProductResponseDataGlobalProductAssociationSkuMappingsSalesAttributeMappings": Product202309GetProductResponseDataGlobalProductAssociationSkuMappingsSalesAttributeMappings,
    "Product202309GetProductResponseDataIntegratedPlatformStatuses": Product202309GetProductResponseDataIntegratedPlatformStatuses,
    "Product202309GetProductResponseDataMainImages": Product202309GetProductResponseDataMainImages,
    "Product202309GetProductResponseDataPackageDimensions": Product202309GetProductResponseDataPackageDimensions,
    "Product202309GetProductResponseDataPackageWeight": Product202309GetProductResponseDataPackageWeight,
    "Product202309GetProductResponseDataPrescriptionRequirement": Product202309GetProductResponseDataPrescriptionRequirement,
    "Product202309GetProductResponseDataProductAttributes": Product202309GetProductResponseDataProductAttributes,
    "Product202309GetProductResponseDataProductAttributesValues": Product202309GetProductResponseDataProductAttributesValues,
    "Product202309GetProductResponseDataProductFamilies": Product202309GetProductResponseDataProductFamilies,
    "Product202309GetProductResponseDataProductFamiliesProducts": Product202309GetProductResponseDataProductFamiliesProducts,
    "Product202309GetProductResponseDataRecommendedCategories": Product202309GetProductResponseDataRecommendedCategories,
    "Product202309GetProductResponseDataSizeChart": Product202309GetProductResponseDataSizeChart,
    "Product202309GetProductResponseDataSizeChartImage": Product202309GetProductResponseDataSizeChartImage,
    "Product202309GetProductResponseDataSizeChartTemplate": Product202309GetProductResponseDataSizeChartTemplate,
    "Product202309GetProductResponseDataSkus": Product202309GetProductResponseDataSkus,
    "Product202309GetProductResponseDataSkusCombinedSkus": Product202309GetProductResponseDataSkusCombinedSkus,
    "Product202309GetProductResponseDataSkusExternalListPrices": Product202309GetProductResponseDataSkusExternalListPrices,
    "Product202309GetProductResponseDataSkusGlobalListingPolicy": Product202309GetProductResponseDataSkusGlobalListingPolicy,
    "Product202309GetProductResponseDataSkusGlobalListingPolicyReplicateSource": Product202309GetProductResponseDataSkusGlobalListingPolicyReplicateSource,
    "Product202309GetProductResponseDataSkusIdentifierCode": Product202309GetProductResponseDataSkusIdentifierCode,
    "Product202309GetProductResponseDataSkusInventory": Product202309GetProductResponseDataSkusInventory,
    "Product202309GetProductResponseDataSkusListPrice": Product202309GetProductResponseDataSkusListPrice,
    "Product202309GetProductResponseDataSkusPreSale": Product202309GetProductResponseDataSkusPreSale,
    "Product202309GetProductResponseDataSkusPreSaleFulfillmentType": Product202309GetProductResponseDataSkusPreSaleFulfillmentType,
    "Product202309GetProductResponseDataSkusPrice": Product202309GetProductResponseDataSkusPrice,
    "Product202309GetProductResponseDataSkusSalesAttributes": Product202309GetProductResponseDataSkusSalesAttributes,
    "Product202309GetProductResponseDataSkusSalesAttributesSkuImg": Product202309GetProductResponseDataSkusSalesAttributesSkuImg,
    "Product202309GetProductResponseDataSkusSalesAttributesSupplementarySkuImages": Product202309GetProductResponseDataSkusSalesAttributesSupplementarySkuImages,
    "Product202309GetProductResponseDataVideo": Product202309GetProductResponseDataVideo,
    "Product202309InventorySearchRequestBody": Product202309InventorySearchRequestBody,
    "Product202309InventorySearchResponse": Product202309InventorySearchResponse,
    "Product202309InventorySearchResponseData": Product202309InventorySearchResponseData,
    "Product202309InventorySearchResponseDataInventory": Product202309InventorySearchResponseDataInventory,
    "Product202309InventorySearchResponseDataInventorySkus": Product202309InventorySearchResponseDataInventorySkus,
    "Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistribution": Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistribution,
    "Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCampaignInventory": Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCampaignInventory,
    "Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCreatorInventory": Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionCreatorInventory,
    "Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionInShopInventory": Product202309InventorySearchResponseDataInventorySkusTotalAvailableInventoryDistributionInShopInventory,
    "Product202309InventorySearchResponseDataInventorySkusWarehouseInventory": Product202309InventorySearchResponseDataInventorySkusWarehouseInventory,
    "Product202309PartialEditProductRequestBody": Product202309PartialEditProductRequestBody,
    "Product202309PartialEditProductRequestBodyCertifications": Product202309PartialEditProductRequestBodyCertifications,
    "Product202309PartialEditProductRequestBodyCertificationsFiles": Product202309PartialEditProductRequestBodyCertificationsFiles,
    "Product202309PartialEditProductRequestBodyCertificationsImages": Product202309PartialEditProductRequestBodyCertificationsImages,
    "Product202309PartialEditProductRequestBodyMainImages": Product202309PartialEditProductRequestBodyMainImages,
    "Product202309PartialEditProductRequestBodyPackageDimensions": Product202309PartialEditProductRequestBodyPackageDimensions,
    "Product202309PartialEditProductRequestBodyPackageWeight": Product202309PartialEditProductRequestBodyPackageWeight,
    "Product202309PartialEditProductRequestBodyProductAttributes": Product202309PartialEditProductRequestBodyProductAttributes,
    "Product202309PartialEditProductRequestBodyProductAttributesValues": Product202309PartialEditProductRequestBodyProductAttributesValues,
    "Product202309PartialEditProductRequestBodySizeChart": Product202309PartialEditProductRequestBodySizeChart,
    "Product202309PartialEditProductRequestBodySizeChartImage": Product202309PartialEditProductRequestBodySizeChartImage,
    "Product202309PartialEditProductRequestBodySizeChartTemplate": Product202309PartialEditProductRequestBodySizeChartTemplate,
    "Product202309PartialEditProductRequestBodySkus": Product202309PartialEditProductRequestBodySkus,
    "Product202309PartialEditProductRequestBodySkusExternalListPrices": Product202309PartialEditProductRequestBodySkusExternalListPrices,
    "Product202309PartialEditProductRequestBodySkusIdentifierCode": Product202309PartialEditProductRequestBodySkusIdentifierCode,
    "Product202309PartialEditProductRequestBodySkusInventory": Product202309PartialEditProductRequestBodySkusInventory,
    "Product202309PartialEditProductRequestBodySkusListPrice": Product202309PartialEditProductRequestBodySkusListPrice,
    "Product202309PartialEditProductRequestBodySkusPreSale": Product202309PartialEditProductRequestBodySkusPreSale,
    "Product202309PartialEditProductRequestBodySkusPreSaleFulfillmentType": Product202309PartialEditProductRequestBodySkusPreSaleFulfillmentType,
    "Product202309PartialEditProductRequestBodySkusPrice": Product202309PartialEditProductRequestBodySkusPrice,
    "Product202309PartialEditProductRequestBodySkusSalesAttributes": Product202309PartialEditProductRequestBodySkusSalesAttributes,
    "Product202309PartialEditProductRequestBodySkusSalesAttributesSkuImg": Product202309PartialEditProductRequestBodySkusSalesAttributesSkuImg,
    "Product202309PartialEditProductRequestBodySkusSalesAttributesSupplementarySkuImages": Product202309PartialEditProductRequestBodySkusSalesAttributesSupplementarySkuImages,
    "Product202309PartialEditProductRequestBodyVideo": Product202309PartialEditProductRequestBodyVideo,
    "Product202309PartialEditProductResponse": Product202309PartialEditProductResponse,
    "Product202309PartialEditProductResponseData": Product202309PartialEditProductResponseData,
    "Product202309PartialEditProductResponseDataAudit": Product202309PartialEditProductResponseDataAudit,
    "Product202309PartialEditProductResponseDataSkus": Product202309PartialEditProductResponseDataSkus,
    "Product202309PartialEditProductResponseDataSkusSalesAttributes": Product202309PartialEditProductResponseDataSkusSalesAttributes,
    "Product202309PublishGlobalProductRequestBody": Product202309PublishGlobalProductRequestBody,
    "Product202309PublishGlobalProductRequestBodyPublishTarget": Product202309PublishGlobalProductRequestBodyPublishTarget,
    "Product202309PublishGlobalProductRequestBodyPublishTargetSkus": Product202309PublishGlobalProductRequestBodyPublishTargetSkus,
    "Product202309PublishGlobalProductRequestBodyPublishTargetSkusInventory": Product202309PublishGlobalProductRequestBodyPublishTargetSkusInventory,
    "Product202309PublishGlobalProductRequestBodyPublishTargetSkusPrice": Product202309PublishGlobalProductRequestBodyPublishTargetSkusPrice,
    "Product202309PublishGlobalProductResponse": Product202309PublishGlobalProductResponse,
    "Product202309PublishGlobalProductResponseData": Product202309PublishGlobalProductResponseData,
    "Product202309PublishGlobalProductResponseDataProducts": Product202309PublishGlobalProductResponseDataProducts,
    "Product202309PublishGlobalProductResponseDataProductsSkus": Product202309PublishGlobalProductResponseDataProductsSkus,
    "Product202309PublishGlobalProductResponseDataProductsSkusSaleAttributes": Product202309PublishGlobalProductResponseDataProductsSkusSaleAttributes,
    "Product202309PublishGlobalProductResponseDataPublishResult": Product202309PublishGlobalProductResponseDataPublishResult,
    "Product202309PublishGlobalProductResponseDataPublishResultFailReasons": Product202309PublishGlobalProductResponseDataPublishResultFailReasons,
    "Product202309RecommendCategoryRequestBody": Product202309RecommendCategoryRequestBody,
    "Product202309RecommendCategoryRequestBodyImages": Product202309RecommendCategoryRequestBodyImages,
    "Product202309RecommendCategoryResponse": Product202309RecommendCategoryResponse,
    "Product202309RecommendCategoryResponseData": Product202309RecommendCategoryResponseData,
    "Product202309RecommendCategoryResponseDataCategories": Product202309RecommendCategoryResponseDataCategories,
    "Product202309RecommendGlobalCategoriesRequestBody": Product202309RecommendGlobalCategoriesRequestBody,
    "Product202309RecommendGlobalCategoriesRequestBodyImages": Product202309RecommendGlobalCategoriesRequestBodyImages,
    "Product202309RecommendGlobalCategoriesResponse": Product202309RecommendGlobalCategoriesResponse,
    "Product202309RecommendGlobalCategoriesResponseData": Product202309RecommendGlobalCategoriesResponseData,
    "Product202309RecommendGlobalCategoriesResponseDataCategories": Product202309RecommendGlobalCategoriesResponseDataCategories,
    "Product202309RecoverProductsRequestBody": Product202309RecoverProductsRequestBody,
    "Product202309RecoverProductsResponse": Product202309RecoverProductsResponse,
    "Product202309RecoverProductsResponseData": Product202309RecoverProductsResponseData,
    "Product202309RecoverProductsResponseDataErrors": Product202309RecoverProductsResponseDataErrors,
    "Product202309RecoverProductsResponseDataErrorsDetail": Product202309RecoverProductsResponseDataErrorsDetail,
    "Product202309SearchGlobalProductsRequestBody": Product202309SearchGlobalProductsRequestBody,
    "Product202309SearchGlobalProductsResponse": Product202309SearchGlobalProductsResponse,
    "Product202309SearchGlobalProductsResponseData": Product202309SearchGlobalProductsResponseData,
    "Product202309SearchGlobalProductsResponseDataGlobalProducts": Product202309SearchGlobalProductsResponseDataGlobalProducts,
    "Product202309SearchGlobalProductsResponseDataGlobalProductsSkus": Product202309SearchGlobalProductsResponseDataGlobalProductsSkus,
    "Product202309SearchProductsRequestBody": Product202309SearchProductsRequestBody,
    "Product202309SearchProductsResponse": Product202309SearchProductsResponse,
    "Product202309SearchProductsResponseData": Product202309SearchProductsResponseData,
    "Product202309SearchProductsResponseDataProducts": Product202309SearchProductsResponseDataProducts,
    "Product202309SearchProductsResponseDataProductsRecommendedCategories": Product202309SearchProductsResponseDataProductsRecommendedCategories,
    "Product202309SearchProductsResponseDataProductsSkus": Product202309SearchProductsResponseDataProductsSkus,
    "Product202309SearchProductsResponseDataProductsSkusInventory": Product202309SearchProductsResponseDataProductsSkusInventory,
    "Product202309SearchProductsResponseDataProductsSkusPrice": Product202309SearchProductsResponseDataProductsSkusPrice,
    "Product202309UpdateGlobalInventoryRequestBody": Product202309UpdateGlobalInventoryRequestBody,
    "Product202309UpdateGlobalInventoryRequestBodyGlobalSkus": Product202309UpdateGlobalInventoryRequestBodyGlobalSkus,
    "Product202309UpdateGlobalInventoryRequestBodyGlobalSkusInventory": Product202309UpdateGlobalInventoryRequestBodyGlobalSkusInventory,
    "Product202309UpdateGlobalInventoryResponse": Product202309UpdateGlobalInventoryResponse,
    "Product202309UpdateInventoryRequestBody": Product202309UpdateInventoryRequestBody,
    "Product202309UpdateInventoryRequestBodySkus": Product202309UpdateInventoryRequestBodySkus,
    "Product202309UpdateInventoryRequestBodySkusInventory": Product202309UpdateInventoryRequestBodySkusInventory,
    "Product202309UpdateInventoryResponse": Product202309UpdateInventoryResponse,
    "Product202309UpdateInventoryResponseData": Product202309UpdateInventoryResponseData,
    "Product202309UpdateInventoryResponseDataErrors": Product202309UpdateInventoryResponseDataErrors,
    "Product202309UpdateInventoryResponseDataErrorsDetail": Product202309UpdateInventoryResponseDataErrorsDetail,
    "Product202309UpdateInventoryResponseDataErrorsDetailExtraErrors": Product202309UpdateInventoryResponseDataErrorsDetailExtraErrors,
    "Product202309UpdatePriceRequestBody": Product202309UpdatePriceRequestBody,
    "Product202309UpdatePriceRequestBodySkus": Product202309UpdatePriceRequestBodySkus,
    "Product202309UpdatePriceRequestBodySkusExternalListPrices": Product202309UpdatePriceRequestBodySkusExternalListPrices,
    "Product202309UpdatePriceRequestBodySkusListPrice": Product202309UpdatePriceRequestBodySkusListPrice,
    "Product202309UpdatePriceRequestBodySkusPrice": Product202309UpdatePriceRequestBodySkusPrice,
    "Product202309UpdatePriceResponse": Product202309UpdatePriceResponse,
    "Product202309UploadProductFileResponse": Product202309UploadProductFileResponse,
    "Product202309UploadProductFileResponseData": Product202309UploadProductFileResponseData,
    "Product202309UploadProductImageResponse": Product202309UploadProductImageResponse,
    "Product202309UploadProductImageResponseData": Product202309UploadProductImageResponseData,
    "Product202312CheckListingPrerequisitesResponse": Product202312CheckListingPrerequisitesResponse,
    "Product202312CheckListingPrerequisitesResponseData": Product202312CheckListingPrerequisitesResponseData,
    "Product202312CheckListingPrerequisitesResponseDataCheckResults": Product202312CheckListingPrerequisitesResponseDataCheckResults,
    "Product202312SearchGlobalProductsRequestBody": Product202312SearchGlobalProductsRequestBody,
    "Product202312SearchGlobalProductsResponse": Product202312SearchGlobalProductsResponse,
    "Product202312SearchGlobalProductsResponseData": Product202312SearchGlobalProductsResponseData,
    "Product202312SearchGlobalProductsResponseDataGlobalProducts": Product202312SearchGlobalProductsResponseDataGlobalProducts,
    "Product202312SearchGlobalProductsResponseDataGlobalProductsSkus": Product202312SearchGlobalProductsResponseDataGlobalProductsSkus,
    "Product202312SearchProductsRequestBody": Product202312SearchProductsRequestBody,
    "Product202312SearchProductsResponse": Product202312SearchProductsResponse,
    "Product202312SearchProductsResponseData": Product202312SearchProductsResponseData,
    "Product202312SearchProductsResponseDataProducts": Product202312SearchProductsResponseDataProducts,
    "Product202312SearchProductsResponseDataProductsAudit": Product202312SearchProductsResponseDataProductsAudit,
    "Product202312SearchProductsResponseDataProductsIntegratedPlatformStatuses": Product202312SearchProductsResponseDataProductsIntegratedPlatformStatuses,
    "Product202312SearchProductsResponseDataProductsRecommendedCategories": Product202312SearchProductsResponseDataProductsRecommendedCategories,
    "Product202312SearchProductsResponseDataProductsSkus": Product202312SearchProductsResponseDataProductsSkus,
    "Product202312SearchProductsResponseDataProductsSkusExternalListPrices": Product202312SearchProductsResponseDataProductsSkusExternalListPrices,
    "Product202312SearchProductsResponseDataProductsSkusInventory": Product202312SearchProductsResponseDataProductsSkusInventory,
    "Product202312SearchProductsResponseDataProductsSkusListPrice": Product202312SearchProductsResponseDataProductsSkusListPrice,
    "Product202312SearchProductsResponseDataProductsSkusPrice": Product202312SearchProductsResponseDataProductsSkusPrice,
    "Product202401ListingSchemasResponse": Product202401ListingSchemasResponse,
    "Product202401ListingSchemasResponseData": Product202401ListingSchemasResponseData,
    "Product202401ListingSchemasResponseDataErrors": Product202401ListingSchemasResponseDataErrors,
    "Product202401ListingSchemasResponseDataErrorsDetail": Product202401ListingSchemasResponseDataErrorsDetail,
    "Product202401ListingSchemasResponseDataListingSchemas": Product202401ListingSchemasResponseDataListingSchemas,
    "Product202401ListingSchemasResponseDataListingSchemasFileds": Product202401ListingSchemasResponseDataListingSchemasFileds,
    "Product202401ListingSchemasResponseDataListingSchemasFiledsComplexValues": Product202401ListingSchemasResponseDataListingSchemasFiledsComplexValues,
    "Product202401ListingSchemasResponseDataListingSchemasFiledsComplexValuesOptions": Product202401ListingSchemasResponseDataListingSchemasFiledsComplexValuesOptions,
    "Product202401ListingSchemasResponseDataListingSchemasFiledsComplexValuesRules": Product202401ListingSchemasResponseDataListingSchemasFiledsComplexValuesRules,
    "Product202401ListingSchemasResponseDataListingSchemasFiledsOptions": Product202401ListingSchemasResponseDataListingSchemasFiledsOptions,
    "Product202401ListingSchemasResponseDataListingSchemasFiledsRules": Product202401ListingSchemasResponseDataListingSchemasFiledsRules,
    "Product202404OptimizedImagesRequestBody": Product202404OptimizedImagesRequestBody,
    "Product202404OptimizedImagesRequestBodyImages": Product202404OptimizedImagesRequestBodyImages,
    "Product202404OptimizedImagesResponse": Product202404OptimizedImagesResponse,
    "Product202404OptimizedImagesResponseData": Product202404OptimizedImagesResponseData,
    "Product202404OptimizedImagesResponseDataImages": Product202404OptimizedImagesResponseDataImages,
    "Product202405GetProductsSEOWordsResponse": Product202405GetProductsSEOWordsResponse,
    "Product202405GetProductsSEOWordsResponseData": Product202405GetProductsSEOWordsResponseData,
    "Product202405GetProductsSEOWordsResponseDataProducts": Product202405GetProductsSEOWordsResponseDataProducts,
    "Product202405GetProductsSEOWordsResponseDataProductsSeoWords": Product202405GetProductsSEOWordsResponseDataProductsSeoWords,
    "Product202405GetRecommendedProductTitleAndDescriptionResponse": Product202405GetRecommendedProductTitleAndDescriptionResponse,
    "Product202405GetRecommendedProductTitleAndDescriptionResponseData": Product202405GetRecommendedProductTitleAndDescriptionResponseData,
    "Product202405GetRecommendedProductTitleAndDescriptionResponseDataProducts": Product202405GetRecommendedProductTitleAndDescriptionResponseDataProducts,
    "Product202405GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestions": Product202405GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestions,
    "Product202405GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestionsItems": Product202405GetRecommendedProductTitleAndDescriptionResponseDataProductsSuggestionsItems,
    "Product202405ProductInformationIssueDiagnosisResponse": Product202405ProductInformationIssueDiagnosisResponse,
    "Product202405ProductInformationIssueDiagnosisResponseData": Product202405ProductInformationIssueDiagnosisResponseData,
    "Product202405ProductInformationIssueDiagnosisResponseDataProducts": Product202405ProductInformationIssueDiagnosisResponseDataProducts,
    "Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnoses": Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnoses,
    "Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesDiagnosisResults": Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesDiagnosisResults,
    "Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestion": Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestion,
    "Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionImages": Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionImages,
    "Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSeoWords": Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSeoWords,
    "Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSmartTexts": Product202405ProductInformationIssueDiagnosisResponseDataProductsDiagnosesSuggestionSmartTexts,
    "Product202405ProductInformationIssueDiagnosisResponseDataProductsListingQuality": Product202405ProductInformationIssueDiagnosisResponseDataProductsListingQuality,
    "Product202407CreateCategoryUpgradeTaskResponse": Product202407CreateCategoryUpgradeTaskResponse,
    "Product202407ListingSchemasResponse": Product202407ListingSchemasResponse,
    "Product202407ListingSchemasResponseData": Product202407ListingSchemasResponseData,
    "Product202407ListingSchemasResponseDataErrors": Product202407ListingSchemasResponseDataErrors,
    "Product202407ListingSchemasResponseDataErrorsDetail": Product202407ListingSchemasResponseDataErrorsDetail,
    "Product202407ListingSchemasResponseDataListingSchemas": Product202407ListingSchemasResponseDataListingSchemas,
    "Product202407ListingSchemasResponseDataListingSchemasFields": Product202407ListingSchemasResponseDataListingSchemasFields,
    "Product202407ListingSchemasResponseDataListingSchemasFieldsComplexValues": Product202407ListingSchemasResponseDataListingSchemasFieldsComplexValues,
    "Product202407ListingSchemasResponseDataListingSchemasFieldsComplexValuesOptions": Product202407ListingSchemasResponseDataListingSchemasFieldsComplexValuesOptions,
    "Product202407ListingSchemasResponseDataListingSchemasFieldsComplexValuesRules": Product202407ListingSchemasResponseDataListingSchemasFieldsComplexValuesRules,
    "Product202407ListingSchemasResponseDataListingSchemasFieldsOptions": Product202407ListingSchemasResponseDataListingSchemasFieldsOptions,
    "Product202407ListingSchemasResponseDataListingSchemasFieldsRules": Product202407ListingSchemasResponseDataListingSchemasFieldsRules,
    "Product202407SearchSizeChartsRequestBody": Product202407SearchSizeChartsRequestBody,
    "Product202407SearchSizeChartsResponse": Product202407SearchSizeChartsResponse,
    "Product202407SearchSizeChartsResponseData": Product202407SearchSizeChartsResponseData,
    "Product202407SearchSizeChartsResponseDataSizeChart": Product202407SearchSizeChartsResponseDataSizeChart,
    "Product202407SearchSizeChartsResponseDataSizeChartImages": Product202407SearchSizeChartsResponseDataSizeChartImages,
    "Product202409CreateManufacturerRequestBody": Product202409CreateManufacturerRequestBody,
    "Product202409CreateManufacturerRequestBodyPhoneNumber": Product202409CreateManufacturerRequestBodyPhoneNumber,
    "Product202409CreateManufacturerResponse": Product202409CreateManufacturerResponse,
    "Product202409CreateManufacturerResponseData": Product202409CreateManufacturerResponseData,
    "Product202409CreateResponsiblePersonRequestBody": Product202409CreateResponsiblePersonRequestBody,
    "Product202409CreateResponsiblePersonRequestBodyAddress": Product202409CreateResponsiblePersonRequestBodyAddress,
    "Product202409CreateResponsiblePersonRequestBodyPhoneNumber": Product202409CreateResponsiblePersonRequestBodyPhoneNumber,
    "Product202409CreateResponsiblePersonResponse": Product202409CreateResponsiblePersonResponse,
    "Product202409CreateResponsiblePersonResponseData": Product202409CreateResponsiblePersonResponseData,
    "Product202409PartialEditManufacturerRequestBody": Product202409PartialEditManufacturerRequestBody,
    "Product202409PartialEditManufacturerRequestBodyPhoneNumber": Product202409PartialEditManufacturerRequestBodyPhoneNumber,
    "Product202409PartialEditManufacturerResponse": Product202409PartialEditManufacturerResponse,
    "Product202409PartialEditResponsiblePersonRequestBody": Product202409PartialEditResponsiblePersonRequestBody,
    "Product202409PartialEditResponsiblePersonRequestBodyAddress": Product202409PartialEditResponsiblePersonRequestBodyAddress,
    "Product202409PartialEditResponsiblePersonRequestBodyPhoneNumber": Product202409PartialEditResponsiblePersonRequestBodyPhoneNumber,
    "Product202409PartialEditResponsiblePersonResponse": Product202409PartialEditResponsiblePersonResponse,
    "Product202409SearchManufacturersRequestBody": Product202409SearchManufacturersRequestBody,
    "Product202409SearchManufacturersResponse": Product202409SearchManufacturersResponse,
    "Product202409SearchManufacturersResponseData": Product202409SearchManufacturersResponseData,
    "Product202409SearchManufacturersResponseDataManufacturers": Product202409SearchManufacturersResponseDataManufacturers,
    "Product202409SearchManufacturersResponseDataManufacturersPhoneNumber": Product202409SearchManufacturersResponseDataManufacturersPhoneNumber,
    "Product202409SearchResponsiblePersonsRequestBody": Product202409SearchResponsiblePersonsRequestBody,
    "Product202409SearchResponsiblePersonsResponse": Product202409SearchResponsiblePersonsResponse,
    "Product202409SearchResponsiblePersonsResponseData": Product202409SearchResponsiblePersonsResponseData,
    "Product202409SearchResponsiblePersonsResponseDataResponsiblePersons": Product202409SearchResponsiblePersonsResponseDataResponsiblePersons,
    "Product202409SearchResponsiblePersonsResponseDataResponsiblePersonsAddress": Product202409SearchResponsiblePersonsResponseDataResponsiblePersonsAddress,
    "Product202409SearchResponsiblePersonsResponseDataResponsiblePersonsPhoneNumber": Product202409SearchResponsiblePersonsResponseDataResponsiblePersonsPhoneNumber,
    "Product202501SearchManufacturersRequestBody": Product202501SearchManufacturersRequestBody,
    "Product202501SearchManufacturersResponse": Product202501SearchManufacturersResponse,
    "Product202501SearchManufacturersResponseData": Product202501SearchManufacturersResponseData,
    "Product202501SearchManufacturersResponseDataManufacturers": Product202501SearchManufacturersResponseDataManufacturers,
    "Product202501SearchManufacturersResponseDataManufacturersRegionalProfiles": Product202501SearchManufacturersResponseDataManufacturersRegionalProfiles,
    "Product202501SearchManufacturersResponseDataManufacturersRegionalProfilesPhoneNumber": Product202501SearchManufacturersResponseDataManufacturersRegionalProfilesPhoneNumber,
    "Product202501SearchResponsiblePersonsRequestBody": Product202501SearchResponsiblePersonsRequestBody,
    "Product202501SearchResponsiblePersonsResponse": Product202501SearchResponsiblePersonsResponse,
    "Product202501SearchResponsiblePersonsResponseData": Product202501SearchResponsiblePersonsResponseData,
    "Product202501SearchResponsiblePersonsResponseDataResponsiblePersons": Product202501SearchResponsiblePersonsResponseDataResponsiblePersons,
    "Product202501SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfiles": Product202501SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfiles,
    "Product202501SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesAddress": Product202501SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesAddress,
    "Product202501SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesPhoneNumber": Product202501SearchResponsiblePersonsResponseDataResponsiblePersonsRegionalProfilesPhoneNumber,
    "Product202502SearchProductsRequestBody": Product202502SearchProductsRequestBody,
    "Product202502SearchProductsResponse": Product202502SearchProductsResponse,
    "Product202502SearchProductsResponseData": Product202502SearchProductsResponseData,
    "Product202502SearchProductsResponseDataProducts": Product202502SearchProductsResponseDataProducts,
    "Product202502SearchProductsResponseDataProductsAudit": Product202502SearchProductsResponseDataProductsAudit,
    "Product202502SearchProductsResponseDataProductsIntegratedPlatformStatuses": Product202502SearchProductsResponseDataProductsIntegratedPlatformStatuses,
    "Product202502SearchProductsResponseDataProductsProductFamilies": Product202502SearchProductsResponseDataProductsProductFamilies,
    "Product202502SearchProductsResponseDataProductsProductFamiliesProducts": Product202502SearchProductsResponseDataProductsProductFamiliesProducts,
    "Product202502SearchProductsResponseDataProductsRecommendedCategories": Product202502SearchProductsResponseDataProductsRecommendedCategories,
    "Product202502SearchProductsResponseDataProductsSkus": Product202502SearchProductsResponseDataProductsSkus,
    "Product202502SearchProductsResponseDataProductsSkusExternalListPrices": Product202502SearchProductsResponseDataProductsSkusExternalListPrices,
    "Product202502SearchProductsResponseDataProductsSkusInventory": Product202502SearchProductsResponseDataProductsSkusInventory,
    "Product202502SearchProductsResponseDataProductsSkusListPrice": Product202502SearchProductsResponseDataProductsSkusListPrice,
    "Product202502SearchProductsResponseDataProductsSkusPreSale": Product202502SearchProductsResponseDataProductsSkusPreSale,
    "Product202502SearchProductsResponseDataProductsSkusPreSaleFulfillmentType": Product202502SearchProductsResponseDataProductsSkusPreSaleFulfillmentType,
    "Product202502SearchProductsResponseDataProductsSkusPrice": Product202502SearchProductsResponseDataProductsSkusPrice,
    "Product202505CreateImageTranslationTasksRequestBody": Product202505CreateImageTranslationTasksRequestBody,
    "Product202505CreateImageTranslationTasksRequestBodyImages": Product202505CreateImageTranslationTasksRequestBodyImages,
    "Product202505CreateImageTranslationTasksResponse": Product202505CreateImageTranslationTasksResponse,
    "Product202505CreateImageTranslationTasksResponseData": Product202505CreateImageTranslationTasksResponseData,
    "Product202505CreateImageTranslationTasksResponseDataTranslationTasks": Product202505CreateImageTranslationTasksResponseDataTranslationTasks,
    "Product202506GetImageTranslationTasksResponse": Product202506GetImageTranslationTasksResponse,
    "Product202506GetImageTranslationTasksResponseData": Product202506GetImageTranslationTasksResponseData,
    "Product202506GetImageTranslationTasksResponseDataTranslationTasks": Product202506GetImageTranslationTasksResponseDataTranslationTasks,
    "Product202506GetImageTranslationTasksResponseDataTranslationTasksOriginalImage": Product202506GetImageTranslationTasksResponseDataTranslationTasksOriginalImage,
    "Product202506GetImageTranslationTasksResponseDataTranslationTasksTranslatedImage": Product202506GetImageTranslationTasksResponseDataTranslationTasksTranslatedImage,
    "Promotion202309CreateActivityRequestBody": Promotion202309CreateActivityRequestBody,
    "Promotion202309CreateActivityRequestBodyDiscount": Promotion202309CreateActivityRequestBodyDiscount,
    "Promotion202309CreateActivityRequestBodyDiscountBmsmDiscount": Promotion202309CreateActivityRequestBodyDiscountBmsmDiscount,
    "Promotion202309CreateActivityRequestBodyDiscountBmsmDiscountDetails": Promotion202309CreateActivityRequestBodyDiscountBmsmDiscountDetails,
    "Promotion202309CreateActivityRequestBodyDiscountGiftDiscount": Promotion202309CreateActivityRequestBodyDiscountGiftDiscount,
    "Promotion202309CreateActivityRequestBodyDiscountGiftDiscountGiftInfos": Promotion202309CreateActivityRequestBodyDiscountGiftDiscountGiftInfos,
    "Promotion202309CreateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails": Promotion202309CreateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails,
    "Promotion202309CreateActivityRequestBodyDiscountShippingDiscount": Promotion202309CreateActivityRequestBodyDiscountShippingDiscount,
    "Promotion202309CreateActivityRequestBodyDiscountShippingDiscountAreaScope": Promotion202309CreateActivityRequestBodyDiscountShippingDiscountAreaScope,
    "Promotion202309CreateActivityRequestBodyParticipationLimit": Promotion202309CreateActivityRequestBodyParticipationLimit,
    "Promotion202309CreateActivityResponse": Promotion202309CreateActivityResponse,
    "Promotion202309CreateActivityResponseData": Promotion202309CreateActivityResponseData,
    "Promotion202309DeactivateActivityResponse": Promotion202309DeactivateActivityResponse,
    "Promotion202309DeactivateActivityResponseData": Promotion202309DeactivateActivityResponseData,
    "Promotion202309GetActivityResponse": Promotion202309GetActivityResponse,
    "Promotion202309GetActivityResponseData": Promotion202309GetActivityResponseData,
    "Promotion202309GetActivityResponseDataDiscount": Promotion202309GetActivityResponseDataDiscount,
    "Promotion202309GetActivityResponseDataDiscountBmsmDiscount": Promotion202309GetActivityResponseDataDiscountBmsmDiscount,
    "Promotion202309GetActivityResponseDataDiscountBmsmDiscountDetails": Promotion202309GetActivityResponseDataDiscountBmsmDiscountDetails,
    "Promotion202309GetActivityResponseDataDiscountGiftDiscount": Promotion202309GetActivityResponseDataDiscountGiftDiscount,
    "Promotion202309GetActivityResponseDataDiscountGiftDiscountGiftInfos": Promotion202309GetActivityResponseDataDiscountGiftDiscountGiftInfos,
    "Promotion202309GetActivityResponseDataDiscountGiftDiscountGiftInfosGiftDetails": Promotion202309GetActivityResponseDataDiscountGiftDiscountGiftInfosGiftDetails,
    "Promotion202309GetActivityResponseDataDiscountShippingDiscount": Promotion202309GetActivityResponseDataDiscountShippingDiscount,
    "Promotion202309GetActivityResponseDataDiscountShippingDiscountAreaScope": Promotion202309GetActivityResponseDataDiscountShippingDiscountAreaScope,
    "Promotion202309GetActivityResponseDataParticipationLimit": Promotion202309GetActivityResponseDataParticipationLimit,
    "Promotion202309GetActivityResponseDataProducts": Promotion202309GetActivityResponseDataProducts,
    "Promotion202309GetActivityResponseDataProductsActivityPrice": Promotion202309GetActivityResponseDataProductsActivityPrice,
    "Promotion202309GetActivityResponseDataProductsSkus": Promotion202309GetActivityResponseDataProductsSkus,
    "Promotion202309GetActivityResponseDataProductsSkusActivityPrice": Promotion202309GetActivityResponseDataProductsSkusActivityPrice,
    "Promotion202309RemoveActivityProductRequestBody": Promotion202309RemoveActivityProductRequestBody,
    "Promotion202309RemoveActivityProductResponse": Promotion202309RemoveActivityProductResponse,
    "Promotion202309RemoveActivityProductResponseData": Promotion202309RemoveActivityProductResponseData,
    "Promotion202309SearchActivitiesRequestBody": Promotion202309SearchActivitiesRequestBody,
    "Promotion202309SearchActivitiesResponse": Promotion202309SearchActivitiesResponse,
    "Promotion202309SearchActivitiesResponseData": Promotion202309SearchActivitiesResponseData,
    "Promotion202309SearchActivitiesResponseDataActivities": Promotion202309SearchActivitiesResponseDataActivities,
    "Promotion202309SearchActivitiesResponseDataActivitiesDiscount": Promotion202309SearchActivitiesResponseDataActivitiesDiscount,
    "Promotion202309SearchActivitiesResponseDataActivitiesDiscountBmsmDiscount": Promotion202309SearchActivitiesResponseDataActivitiesDiscountBmsmDiscount,
    "Promotion202309SearchActivitiesResponseDataActivitiesDiscountBmsmDiscountDetails": Promotion202309SearchActivitiesResponseDataActivitiesDiscountBmsmDiscountDetails,
    "Promotion202309SearchActivitiesResponseDataActivitiesDiscountGiftDiscount": Promotion202309SearchActivitiesResponseDataActivitiesDiscountGiftDiscount,
    "Promotion202309SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfos": Promotion202309SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfos,
    "Promotion202309SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfosGiftDetails": Promotion202309SearchActivitiesResponseDataActivitiesDiscountGiftDiscountGiftInfosGiftDetails,
    "Promotion202309SearchActivitiesResponseDataActivitiesDiscountShippingDiscount": Promotion202309SearchActivitiesResponseDataActivitiesDiscountShippingDiscount,
    "Promotion202309SearchActivitiesResponseDataActivitiesDiscountShippingDiscountAreaScope": Promotion202309SearchActivitiesResponseDataActivitiesDiscountShippingDiscountAreaScope,
    "Promotion202309SearchActivitiesResponseDataActivitiesParticipationLimit": Promotion202309SearchActivitiesResponseDataActivitiesParticipationLimit,
    "Promotion202309UpdateActivityProductRequestBody": Promotion202309UpdateActivityProductRequestBody,
    "Promotion202309UpdateActivityProductRequestBodyProducts": Promotion202309UpdateActivityProductRequestBodyProducts,
    "Promotion202309UpdateActivityProductRequestBodyProductsSkus": Promotion202309UpdateActivityProductRequestBodyProductsSkus,
    "Promotion202309UpdateActivityProductResponse": Promotion202309UpdateActivityProductResponse,
    "Promotion202309UpdateActivityProductResponseData": Promotion202309UpdateActivityProductResponseData,
    "Promotion202309UpdateActivityRequestBody": Promotion202309UpdateActivityRequestBody,
    "Promotion202309UpdateActivityRequestBodyDiscount": Promotion202309UpdateActivityRequestBodyDiscount,
    "Promotion202309UpdateActivityRequestBodyDiscountBmsmDiscount": Promotion202309UpdateActivityRequestBodyDiscountBmsmDiscount,
    "Promotion202309UpdateActivityRequestBodyDiscountBmsmDiscountDetails": Promotion202309UpdateActivityRequestBodyDiscountBmsmDiscountDetails,
    "Promotion202309UpdateActivityRequestBodyDiscountGiftDiscount": Promotion202309UpdateActivityRequestBodyDiscountGiftDiscount,
    "Promotion202309UpdateActivityRequestBodyDiscountGiftDiscountGiftInfos": Promotion202309UpdateActivityRequestBodyDiscountGiftDiscountGiftInfos,
    "Promotion202309UpdateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails": Promotion202309UpdateActivityRequestBodyDiscountGiftDiscountGiftInfosGiftDetails,
    "Promotion202309UpdateActivityRequestBodyDiscountShippingDiscount": Promotion202309UpdateActivityRequestBodyDiscountShippingDiscount,
    "Promotion202309UpdateActivityRequestBodyDiscountShippingDiscountAreaScope": Promotion202309UpdateActivityRequestBodyDiscountShippingDiscountAreaScope,
    "Promotion202309UpdateActivityRequestBodyParticipationLimit": Promotion202309UpdateActivityRequestBodyParticipationLimit,
    "Promotion202309UpdateActivityResponse": Promotion202309UpdateActivityResponse,
    "Promotion202309UpdateActivityResponseData": Promotion202309UpdateActivityResponseData,
    "Promotion202406GetCouponResponse": Promotion202406GetCouponResponse,
    "Promotion202406GetCouponResponseData": Promotion202406GetCouponResponseData,
    "Promotion202406GetCouponResponseDataCoupon": Promotion202406GetCouponResponseDataCoupon,
    "Promotion202406GetCouponResponseDataCouponClaimDuration": Promotion202406GetCouponResponseDataCouponClaimDuration,
    "Promotion202406GetCouponResponseDataCouponDiscount": Promotion202406GetCouponResponseDataCouponDiscount,
    "Promotion202406GetCouponResponseDataCouponDiscountMaxDiscount": Promotion202406GetCouponResponseDataCouponDiscountMaxDiscount,
    "Promotion202406GetCouponResponseDataCouponDiscountReductionAmount": Promotion202406GetCouponResponseDataCouponDiscountReductionAmount,
    "Promotion202406GetCouponResponseDataCouponLiveTasks": Promotion202406GetCouponResponseDataCouponLiveTasks,
    "Promotion202406GetCouponResponseDataCouponRedemptionDuration": Promotion202406GetCouponResponseDataCouponRedemptionDuration,
    "Promotion202406GetCouponResponseDataCouponThreshold": Promotion202406GetCouponResponseDataCouponThreshold,
    "Promotion202406GetCouponResponseDataCouponThresholdMinSpend": Promotion202406GetCouponResponseDataCouponThresholdMinSpend,
    "Promotion202406GetCouponResponseDataCouponUsageLimits": Promotion202406GetCouponResponseDataCouponUsageLimits,
    "Promotion202406GetCouponResponseDataCouponUsageStats": Promotion202406GetCouponResponseDataCouponUsageStats,
    "Promotion202406SearchCouponsRequestBody": Promotion202406SearchCouponsRequestBody,
    "Promotion202406SearchCouponsResponse": Promotion202406SearchCouponsResponse,
    "Promotion202406SearchCouponsResponseData": Promotion202406SearchCouponsResponseData,
    "Promotion202406SearchCouponsResponseDataCoupons": Promotion202406SearchCouponsResponseDataCoupons,
    "Promotion202406SearchCouponsResponseDataCouponsClaimDuration": Promotion202406SearchCouponsResponseDataCouponsClaimDuration,
    "Promotion202406SearchCouponsResponseDataCouponsDiscount": Promotion202406SearchCouponsResponseDataCouponsDiscount,
    "Promotion202406SearchCouponsResponseDataCouponsDiscountMaxDiscount": Promotion202406SearchCouponsResponseDataCouponsDiscountMaxDiscount,
    "Promotion202406SearchCouponsResponseDataCouponsDiscountReductionAmount": Promotion202406SearchCouponsResponseDataCouponsDiscountReductionAmount,
    "Promotion202406SearchCouponsResponseDataCouponsRedemptionDuration": Promotion202406SearchCouponsResponseDataCouponsRedemptionDuration,
    "Promotion202406SearchCouponsResponseDataCouponsThreshold": Promotion202406SearchCouponsResponseDataCouponsThreshold,
    "Promotion202406SearchCouponsResponseDataCouponsThresholdMinSpend": Promotion202406SearchCouponsResponseDataCouponsThresholdMinSpend,
    "Promotion202406SearchCouponsResponseDataCouponsUsageLimits": Promotion202406SearchCouponsResponseDataCouponsUsageLimits,
    "ReturnRefund202309ApproveCancellationResponse": ReturnRefund202309ApproveCancellationResponse,
    "ReturnRefund202309ApproveReturnRequestBody": ReturnRefund202309ApproveReturnRequestBody,
    "ReturnRefund202309ApproveReturnRequestBodyPartialRefund": ReturnRefund202309ApproveReturnRequestBodyPartialRefund,
    "ReturnRefund202309ApproveReturnResponse": ReturnRefund202309ApproveReturnResponse,
    "ReturnRefund202309CalculateRefundRequestBody": ReturnRefund202309CalculateRefundRequestBody,
    "ReturnRefund202309CalculateRefundRequestBodySkus": ReturnRefund202309CalculateRefundRequestBodySkus,
    "ReturnRefund202309CalculateRefundResponse": ReturnRefund202309CalculateRefundResponse,
    "ReturnRefund202309CalculateRefundResponseData": ReturnRefund202309CalculateRefundResponseData,
    "ReturnRefund202309CalculateRefundResponseDataOrderRefundAmount": ReturnRefund202309CalculateRefundResponseDataOrderRefundAmount,
    "ReturnRefund202309CancelOrderRequestBody": ReturnRefund202309CancelOrderRequestBody,
    "ReturnRefund202309CancelOrderRequestBodySkus": ReturnRefund202309CancelOrderRequestBodySkus,
    "ReturnRefund202309CancelOrderResponse": ReturnRefund202309CancelOrderResponse,
    "ReturnRefund202309CancelOrderResponseData": ReturnRefund202309CancelOrderResponseData,
    "ReturnRefund202309CreateReturnRequestBody": ReturnRefund202309CreateReturnRequestBody,
    "ReturnRefund202309CreateReturnRequestBodySkus": ReturnRefund202309CreateReturnRequestBodySkus,
    "ReturnRefund202309CreateReturnResponse": ReturnRefund202309CreateReturnResponse,
    "ReturnRefund202309CreateReturnResponseData": ReturnRefund202309CreateReturnResponseData,
    "ReturnRefund202309GetAftersaleEligibilityResponse": ReturnRefund202309GetAftersaleEligibilityResponse,
    "ReturnRefund202309GetAftersaleEligibilityResponseData": ReturnRefund202309GetAftersaleEligibilityResponseData,
    "ReturnRefund202309GetAftersaleEligibilityResponseDataSkuEligibility": ReturnRefund202309GetAftersaleEligibilityResponseDataSkuEligibility,
    "ReturnRefund202309GetAftersaleEligibilityResponseDataSkuEligibilityLineItemEligibility": ReturnRefund202309GetAftersaleEligibilityResponseDataSkuEligibilityLineItemEligibility,
    "ReturnRefund202309GetRejectReasonsResponse": ReturnRefund202309GetRejectReasonsResponse,
    "ReturnRefund202309GetRejectReasonsResponseData": ReturnRefund202309GetRejectReasonsResponseData,
    "ReturnRefund202309GetRejectReasonsResponseDataReasons": ReturnRefund202309GetRejectReasonsResponseDataReasons,
    "ReturnRefund202309GetReturnRecordsResponse": ReturnRefund202309GetReturnRecordsResponse,
    "ReturnRefund202309GetReturnRecordsResponseData": ReturnRefund202309GetReturnRecordsResponseData,
    "ReturnRefund202309GetReturnRecordsResponseDataRecords": ReturnRefund202309GetReturnRecordsResponseDataRecords,
    "ReturnRefund202309GetReturnRecordsResponseDataRecordsImages": ReturnRefund202309GetReturnRecordsResponseDataRecordsImages,
    "ReturnRefund202309GetReturnRecordsResponseDataRecordsVideos": ReturnRefund202309GetReturnRecordsResponseDataRecordsVideos,
    "ReturnRefund202309RejectCancellationRequestBody": ReturnRefund202309RejectCancellationRequestBody,
    "ReturnRefund202309RejectCancellationRequestBodyImages": ReturnRefund202309RejectCancellationRequestBodyImages,
    "ReturnRefund202309RejectCancellationResponse": ReturnRefund202309RejectCancellationResponse,
    "ReturnRefund202309RejectReturnRequestBody": ReturnRefund202309RejectReturnRequestBody,
    "ReturnRefund202309RejectReturnRequestBodyImages": ReturnRefund202309RejectReturnRequestBodyImages,
    "ReturnRefund202309RejectReturnResponse": ReturnRefund202309RejectReturnResponse,
    "ReturnRefund202309SearchCancellationsRequestBody": ReturnRefund202309SearchCancellationsRequestBody,
    "ReturnRefund202309SearchCancellationsResponse": ReturnRefund202309SearchCancellationsResponse,
    "ReturnRefund202309SearchCancellationsResponseData": ReturnRefund202309SearchCancellationsResponseData,
    "ReturnRefund202309SearchCancellationsResponseDataCancellations": ReturnRefund202309SearchCancellationsResponseDataCancellations,
    "ReturnRefund202309SearchCancellationsResponseDataCancellationsCancelLineItems": ReturnRefund202309SearchCancellationsResponseDataCancellationsCancelLineItems,
    "ReturnRefund202309SearchCancellationsResponseDataCancellationsCancelLineItemsProductImage": ReturnRefund202309SearchCancellationsResponseDataCancellationsCancelLineItemsProductImage,
    "ReturnRefund202309SearchCancellationsResponseDataCancellationsCancelLineItemsRefundAmount": ReturnRefund202309SearchCancellationsResponseDataCancellationsCancelLineItemsRefundAmount,
    "ReturnRefund202309SearchCancellationsResponseDataCancellationsRefundAmount": ReturnRefund202309SearchCancellationsResponseDataCancellationsRefundAmount,
    "ReturnRefund202309SearchCancellationsResponseDataCancellationsSellerNextActionResponse": ReturnRefund202309SearchCancellationsResponseDataCancellationsSellerNextActionResponse,
    "ReturnRefund202309SearchReturnsRequestBody": ReturnRefund202309SearchReturnsRequestBody,
    "ReturnRefund202309SearchReturnsResponse": ReturnRefund202309SearchReturnsResponse,
    "ReturnRefund202309SearchReturnsResponseData": ReturnRefund202309SearchReturnsResponseData,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrders": ReturnRefund202309SearchReturnsResponseDataReturnOrders,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrdersDiscountAmount": ReturnRefund202309SearchReturnsResponseDataReturnOrdersDiscountAmount,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrdersPartialRefund": ReturnRefund202309SearchReturnsResponseDataReturnOrdersPartialRefund,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrdersRefundAmount": ReturnRefund202309SearchReturnsResponseDataReturnOrdersRefundAmount,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnLineItems": ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnLineItems,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnLineItemsProductImage": ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnLineItemsProductImage,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnLineItemsRefundAmount": ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnLineItemsRefundAmount,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnWarehouseAddress": ReturnRefund202309SearchReturnsResponseDataReturnOrdersReturnWarehouseAddress,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrdersSellerNextActionResponse": ReturnRefund202309SearchReturnsResponseDataReturnOrdersSellerNextActionResponse,
    "ReturnRefund202309SearchReturnsResponseDataReturnOrdersShippingFeeAmount": ReturnRefund202309SearchReturnsResponseDataReturnOrdersShippingFeeAmount,
    "Seller202309GetActiveShopsResponse": Seller202309GetActiveShopsResponse,
    "Seller202309GetActiveShopsResponseData": Seller202309GetActiveShopsResponseData,
    "Seller202309GetActiveShopsResponseDataShops": Seller202309GetActiveShopsResponseDataShops,
    "Seller202309GetSellerPermissionsResponse": Seller202309GetSellerPermissionsResponse,
    "Seller202309GetSellerPermissionsResponseData": Seller202309GetSellerPermissionsResponseData,
    "SupplyChain202309ConfirmPackageShipmentRequestBody": SupplyChain202309ConfirmPackageShipmentRequestBody,
    "SupplyChain202309ConfirmPackageShipmentRequestBodyPackages": SupplyChain202309ConfirmPackageShipmentRequestBodyPackages,
    "SupplyChain202309ConfirmPackageShipmentRequestBodyPackagesDimension": SupplyChain202309ConfirmPackageShipmentRequestBodyPackagesDimension,
    "SupplyChain202309ConfirmPackageShipmentRequestBodyPackagesSkus": SupplyChain202309ConfirmPackageShipmentRequestBodyPackagesSkus,
    "SupplyChain202309ConfirmPackageShipmentRequestBodyPackagesWeight": SupplyChain202309ConfirmPackageShipmentRequestBodyPackagesWeight,
    "SupplyChain202309ConfirmPackageShipmentResponse": SupplyChain202309ConfirmPackageShipmentResponse,
    "SupplyChain202309ConfirmPackageShipmentResponseData": SupplyChain202309ConfirmPackageShipmentResponseData,
    "SupplyChain202309ConfirmPackageShipmentResponseDataErrors": SupplyChain202309ConfirmPackageShipmentResponseDataErrors,
    "SupplyChain202309ConfirmPackageShipmentResponseDataErrorsDetail": SupplyChain202309ConfirmPackageShipmentResponseDataErrorsDetail,
}

export class ObjectSerializer {
    public static findCorrectType(data: any, expectedType: string) {
        if (data == undefined) {
            return expectedType;
        } else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        } else if (expectedType === "Date") {
            return expectedType;
        } else {
            if (enumsMap[expectedType]) {
                return expectedType;
            }

            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }

            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            } else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    if(typeMap[discriminatorType]){
                        return discriminatorType; // use the type given in the discriminator
                    } else {
                        return expectedType; // discriminator did not map to a type
                    }
                } else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }

    public static serialize(data: any, type: string) {
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index = 0; index < data.length; index++) {
                let datum = data[index];
                transformedData.push(ObjectSerializer.serialize(datum, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return data.toISOString();
        } else {
            if (enumsMap[type]) {
                return data;
            }
            if (!typeMap[type]) { // in case we dont know the type
                return data;
            }

            // Get the actual type of this object
            type = this.findCorrectType(data, type);

            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance: {[index: string]: any} = {};
            for (let index = 0; index < attributeTypes.length; index++) {
                let attributeType = attributeTypes[index];
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type);
            }
            return instance;
        }
    }

    public static deserialize(data: any, type: string) {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index = 0; index < data.length; index++) {
                let datum = data[index];
                transformedData.push(ObjectSerializer.deserialize(datum, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return new Date(data);
        } else {
            if (enumsMap[type]) {// is Enum
                return data;
            }

            if (!typeMap[type]) { // dont know the type
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let index = 0; index < attributeTypes.length; index++) {
                let attributeType = attributeTypes[index];
                instance[attributeType.name] = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type);
            }
            return instance;
        }
    }
}

export interface Authentication {
    /**
    * Apply authentication settings to header and query params.
    */
    applyToRequest(requestOptions: localVarRequest.Options): Promise<void> | void;
}

export class HttpBasicAuth implements Authentication {
    public username: string = '';
    public password: string = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        requestOptions.auth = {
            username: this.username, password: this.password
        }
    }
}

export class HttpBearerAuth implements Authentication {
    public accessToken: string | (() => string) = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (requestOptions && requestOptions.headers) {
            const accessToken = typeof this.accessToken === 'function'
                            ? this.accessToken()
                            : this.accessToken;
            requestOptions.headers["Authorization"] = "Bearer " + accessToken;
        }
    }
}

export class ApiKeyAuth implements Authentication {
    public apiKey: string = '';

    constructor(private location: string, private paramName: string) {
    }

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (this.location == "query") {
            (<any>requestOptions.qs)[this.paramName] = this.apiKey;
        } else if (this.location == "header" && requestOptions && requestOptions.headers) {
            requestOptions.headers[this.paramName] = this.apiKey;
        } else if (this.location == 'cookie' && requestOptions && requestOptions.headers) {
            if (requestOptions.headers['Cookie']) {
                requestOptions.headers['Cookie'] += '; ' + this.paramName + '=' + encodeURIComponent(this.apiKey);
            }
            else {
                requestOptions.headers['Cookie'] = this.paramName + '=' + encodeURIComponent(this.apiKey);
            }
        }
    }
}

export class OAuth implements Authentication {
    public accessToken: string = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (requestOptions && requestOptions.headers) {
            requestOptions.headers["Authorization"] = "Bearer " + this.accessToken;
        }
    }
}

export class VoidAuth implements Authentication {
    public username: string = '';
    public password: string = '';

    applyToRequest(_: localVarRequest.Options): void {
        // Do nothing
    }
}

export type Interceptor = (requestOptions: localVarRequest.Options) => (Promise<void> | void);
