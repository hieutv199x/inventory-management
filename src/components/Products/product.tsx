"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import {ArrowDownIcon, ArrowUpIcon, BoxIconLine, ChevronDownIcon, GroupIcon} from "@/icons";
import SelectShop from "@/components/common/SelectShop";
import ChartTab from "@/components/common/ChartTab";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";

export const Product = () => {

    const optionsListing = [
        { label: "UNKNOWN", value: "UNKNOWN" },
        { label: "POOR", value: "POOR" },
        { label: "FAIR", value: "FAIR" },
        { label: "GOOD", value: "GOOD" },
    ];
    const optionStatus = [
        { label: "All", value: "All" },
        { label: "Live", value: "Live" },
        { label: "Reviewing", value: "Reviewing" },
        { label: "Failed", value: "Failed" },
        { label: "Frozen", value: "Frozen" },
        { label: "Deactivated", value: "Deactivated" },
        { label: "Deleted", value: "Deleted" },
    ];

    const handleShopSelect = (shopId: string) => {
        console.log("Selected shop ID:", shopId);
    };
    const handleListingChange= (value: string)=>{
        console.log(value);
    }
    const handleStatusChange= (value: string)=>{
        console.log(value);
    }
    const handlerProduct = async () => {
        try {
            const response = await fetch('/api/tiktok/Products/search-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shop_id: '7496303591743326543',
                    status: 'ALL',
                    page_size: 100,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Error:', result.error || 'Unknown error');
                alert(`Lỗi: ${result.error || 'Unknown error'}`);
                return;
            }

            console.log('✅ Synced products:', result);
            alert(`Đồng bộ thành công ${result.count} sản phẩm!`);
        } catch (err) {
            console.error('❌ Sync failed:', err);
            alert('Gặp lỗi khi đồng bộ sản phẩm');
        }
    };
    return (
        <div>
            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
                <div className="w-full">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Product list
                    </h3>
                </div>
                <div className="flex items-start w-full gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                        <button onClick={handlerProduct} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
                            Sync Products
                        </button>
                        <button
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        >
                            Export products
                        </button>

                        <button
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                <div className="flex items-start justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:pb-4">
                    <div className="block">
                        <form>
                            <div className="relative">
                                <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                                  <svg
                                      className="fill-gray-500 dark:fill-gray-400"
                                      width="20"
                                      height="20"
                                      viewBox="0 0 20 20"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                                        fill=""
                                    />
                                  </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search product name, id..."
                                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                                />

                                <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <SelectShop onChange={handleShopSelect} placeholder="All Shop" enablePlaceholder={false}/>
                    </div>
                    <div className="col-span-1">
                        <Label>Status</Label>
                        <div className="relative">
                            <Select
                                options={optionStatus}
                                onChange={handleStatusChange}
                                enablePlaceholder={false}
                                className="dark:bg-dark-900"
                            />
                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                          <ChevronDownIcon/>
                        </span>
                        </div>
                    </div>
                    <div className="col-span-1">
                            <Label>Listing Quality</Label>
                            <div className="relative">
                                <Select
                                    options={optionsListing}
                                    onChange={handleListingChange}
                                    enablePlaceholder={false}
                                    className="dark:bg-dark-900"
                                />
                                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                          <ChevronDownIcon/>
                        </span>
                            </div>
                        </div>
                    <div className="col-span-1">
                        <div className="grid grid-cols-2 gap-1">
                            <div className="col-span-1">
                                <DatePicker
                                    id="start-date-picker"
                                    label="Start Date"
                                    placeholder="dd/MM/yyyy"
                                    onChange={(dates, currentDateString) => {
                                        // Handle your logic
                                        console.log({ dates, currentDateString });
                                    }}
                                />
                            </div>
                            <div className="col-span-1">
                                <DatePicker
                                    id="end-date-picker"
                                    label="End Date"
                                    placeholder="dd/MM/yyyy"
                                    onChange={(dates, currentDateString) => {
                                        // Handle your logic
                                        console.log({ dates, currentDateString });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>

    );
};
