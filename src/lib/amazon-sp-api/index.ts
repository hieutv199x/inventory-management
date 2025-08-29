// Import the classes to create instances
import { AmazonSPAPIClient } from './client';
import { SellersService } from './services/sellers';
import { CatalogService } from './services/catalog';
import { OrdersService } from './services/orders';
import { InventoryService } from './services/inventory';
import { ListingsService } from './services/listings';

// Create service instances for easy use
export const sellersService = new SellersService();
export const catalogService = new CatalogService();
export const ordersService = new OrdersService();
export const inventoryService = new InventoryService();
export const listingsService = new ListingsService();

// Utility functions
export const createSPAPIClient = (region?: string) => new AmazonSPAPIClient(region);

// Export service classes for custom instantiation
export { AmazonSPAPIClient } from './client';
export { SellersService } from './services/sellers';
export { CatalogService } from './services/catalog';
export { OrdersService } from './services/orders';
export { InventoryService } from './services/inventory';
export { ListingsService } from './services/listings';
