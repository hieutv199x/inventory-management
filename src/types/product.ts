export interface Product {
    id: string;
    productId: string;
    title: string;
    description: string;
    status: string;
    createTime: number;
    shopId: string;
    price: string;
    currency: string;
    shopName?: string;
    shop?: {
        shopName: string;
    };
    images: {
        uri: string;
        urls: string[];
    }[];
    skus: {
        id: string;
        skuId: string;
        price: {
            originalPrice: string;
            currency: string;
            salePrice: string;
        } | null;
    }[];
}
