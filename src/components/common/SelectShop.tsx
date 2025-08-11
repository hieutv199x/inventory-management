"use client";
import React, { useCallback, useEffect, useState } from "react";
import Select from "@/components/form/Select";
import { ChevronDownIcon } from "@/icons";
import Label from "@/components/form/Label";
import { httpClient } from "@/lib/http-client";

interface Shop {
    shopId: string;
    shopName: string | null;
}

// Định nghĩa các props mà component sẽ nhận
interface SelectShopProps {
    onChange: (shopId: string) => void; // Hàm callback khi người dùng chọn một shop khác
    className?: string; // Tùy chọn class để style từ bên ngoài
    placeholder?: string; // Tùy chọn placeholder
    enablePlaceholder?: boolean;
}

export default function SelectShop({
    onChange,
    className = "",
    placeholder = "--- Select Shop ---",
    enablePlaceholder = false,
}: SelectShopProps) {

    const [shops, setShops] = useState<Shop[]>([]);

    const fetchShops = useCallback(async () => {
        try {
            
            const params = new URLSearchParams({
                    status: 'ACTIVE',
                  });
                  
                  const data = await httpClient.get(`/tiktok/shop/get-shops?${params}`);
            // Giả sử API trả về một mảng các shop
            setShops(data.credentials || []);
        } catch (err) {
            console.error("❌ Error fetching shops:", err);
        }
    }, []);


    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

    // Chuyển đổi dữ liệu shop thành option cho Select
    const options = [
        ...(!enablePlaceholder
            ? [{ label: placeholder, value: "all" }]
            : []),
        ...shops.map((shop) => ({
            label: shop.shopName || "Unnamed Shop",
            value: shop.shopId,
        })),
    ];

    const handleShopSelectChange = (value: string) => {
        onChange(value);
    };

    return (
        <div className={className}>
            <Label>Shop</Label>
            <div className="relative">
                <Select
                    options={options}
                    placeholder={placeholder}
                    onChange={handleShopSelectChange}
                    enablePlaceholder={enablePlaceholder}
                    className="dark:bg-dark-900"
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon />
                </span>
            </div>
        </div>
    );
}