"use client";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
  } from "../ui/table";
  import Badge from "../ui/badge/Badge";
  import Button from "../ui/button/Button";
  import { Modal } from "../ui/modal";
  import { useState } from "react";
  import Label from "../form/Label";
import Input from "../form/input/InputField";
  import { useModal } from "@/hooks/useModal";
  import ComponentCard from "../common/ComponentCard";
  import Select from "../form/Select";
  import { ChevronDownIcon } from "@/icons";

  interface Shop {
    id: number; // Unique identifier for each product
    name: string; // Product name
    country: string; 
    serviceId: string; 
    appKey: string;
    appSecret: string;
    image: string; // URL or path to the product image
    status: "Live" | "Jumio" | "Die 7 days" | "Up Doc" | "Shop Closed"; // Status of the product
  }
  
  
  // Define the table data using the interface
  const tableData: Shop[] = [
    {
      id: 1,
      name: "Krik",
      country: "US",
      serviceId: "7523127562265167621",
      appKey: "6gpcogdruq432",
      appSecret: "5e6a7274f903b2e1c6f772049ea979bac7aa4807",
      status: "Live",
      image: "/images/product/product-01.jpg", // Replace with actual image URL
    },
    {
        id: 2,
        name: "Krik2",
        country: "UK",
        serviceId: "7523127562265167621",
        appKey: "6gpcogdruq432",
        appSecret: "5e6a7274f903b2e1c6f772049ea979bac7aa4807",
        status: "Jumio",
        image: "/images/product/product-01.jpg", // Replace with actual image URL
      },
      {
        id: 3,
        name: "Krik3",
        country: "VN",
        serviceId: "7523127562265167621",
        appKey: "6gpcogdruq432",
        appSecret: "5e6a7274f903b2e1c6f772049ea979bac7aa4807",
        status: "Die 7 days",
        image: "/images/product/product-01.jpg", // Replace with actual image URL
      },
      {
        id: 4,
        name: "Krik4",
        country: "US",
        serviceId: "7523127562265167621",
        appKey: "6gpcogdruq432",
        appSecret: "5e6a7274f903b2e1c6f772049ea979bac7aa4807",
        status: "Shop Closed",
        image: "/images/product/product-01.jpg", // Replace with actual image URL
      },
  ];
  
  
  export default function Shops() {
    const options = [
      { value: "US", label: "US" },
      { value: "UK", label: "UK" },
    ];

    const [selectedCountry, setSelectedCountry] = useState<{ value: string; label: string } | null>(null);
    const [showSecret, setShowSecret] = useState<{ [id: number]: boolean }>({});
    const [serviceId, setServiceId] = useState("");
    const [appName, setAppName] = useState("");
    const [appKey, setAppKey] = useState("");
    const [appSecret, setAppSecret] = useState("");

    const { isOpen, openModal, closeModal } = useModal();

    const handleSave = async () => {
      try {
        const payload = {
          country: selectedCountry?.value, 
          serviceId,
          appName,
          appKey,
          appSecret,
        };
    
        const res = await fetch("/api/tiktok/shop/add-shop-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
    
        const data = await res.json();
    
        if (!res.ok) {
          throw new Error(data.error || "Save failed");
        }
    
        console.log("✅ Shop saved:", data);
        closeModal();
        // Gọi refresh nếu cần
      } catch (err) {
        console.error("❌ Save shop error:", err);
      }
    };

    const handleSelectChange = (value: string) => {
      const found = options.find(opt => opt.value === value) || null;
      setSelectedCountry(found);
    };
  
    const handleImportShop = async () => {
        try {
          debugger;
          const res = await fetch("/api/tiktok/shop/authorized-shop", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            // body không cần nếu API không nhận input
          });
      
          const data = await res.json();
          console.log("✔️ TikTok Shop response:", data);
      
          if (!res.ok) {
            throw new Error(data.error || "Something went wrong");
          }
        } catch (err) {
          console.error("❌ Error calling TikTok API:", err);
        }
      };

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Store list
            </h3>
          </div>
  
          <div className="flex items-center gap-2">
            <button onClick={openModal} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Import shop
            </button>
            <button onClick={handleImportShop} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Refresh
            </button>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  No
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  InfoShop
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>
  
            {/* Table Body */}
  
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tableData.map((shop) => (
                <TableRow key={shop.id} className="">
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {shop.id}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {shop.name}
                  </TableCell>
                  
                  <TableCell className="py-3 ">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-gray-500 text-theme-sm dark:text-white/90">
                          Country: {shop.country}
                        </span>
                        <span className="font-medium text-gray-500 text-theme-sm dark:text-white/90">
                           App ID: {shop.serviceId}
                        </span>
                        <span className="font-medium text-gray-500 text-theme-sm dark:text-white/90">
                            App Key: {shop.appKey}
                        </span>
                        <span className="font-medium text-gray-500 w-[450px] text-theme-sm dark:text-white/90 flex items-center">
                            App Secret: 
                            <span className="ms-2">
                                {showSecret[shop.id] ? shop.appSecret : "••••••••"}
                            </span>
                            <button
                            type="button"
                            onClick={() => setShowSecret(prev => ({ ...prev, [shop.id]: !prev[shop.id] }))}
                            className="focus:outline-none ms-2"
                            aria-label={showSecret[shop.id] ? "Ẩn app secret" : "Hiện app secret"}
                            >
                            {showSecret[shop.id] ? (
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                            ) : (
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-6.06M9.53 9.53A3.001 3.001 0 0 0 12 15a3 3 0 0 0 2.47-5.47" stroke="currentColor" strokeWidth="2"/><path d="m1 1 22 22" stroke="currentColor" strokeWidth="2"/></svg>
                            )}
                            </button>
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <Badge
                      size="sm"
                      color={
                        shop.status === "Live"
                          ? "success"
                          : shop.status === "Up Doc" || shop.status === "Jumio"
                          ? "warning"
                          : "error"
                      }
                    >
                      {shop.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                   <div className="flex items-center gap-2">
                      {/* View Button */}
                      <button
                        // onClick={() => handleView(shop)}
                        className="text-blue-500 hover:text-blue-600 transition-colors"
                        title="View"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Edit Button */}
                      <button
                        // onClick={() => handleEdit(shop)}
                        className="text-yellow-500 hover:text-yellow-600 transition-colors"
                        title="Edit"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        // onClick={() => handleDelete(shop.id)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h12Z" />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[584px] p-5 lg:p-10"
      >
        <form className="">
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            Import shop
          </h4>
          <div className="w-1/3">
              <Label>Country</Label>
                <div className="relative">
                  <Select
                    options={options}
                    placeholder="Country"
                    onChange={handleSelectChange}
                    className="dark:bg-dark-900"
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                      <ChevronDownIcon/>
                    </span>
                </div>
            </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            
            <div className="col-span-1">
              <Label>Servive Id</Label>
              <Input type="text" placeholder="ID: 7172**********70150" value={serviceId} onChange={e => setServiceId(e.target.value)} />
            </div>
    
            <div className="col-span-1">
              <Label>App Name</Label>
              <Input type="text" placeholder="Boruch" value={appName} onChange={e => setAppName(e.target.value)} />
            </div>
    
            <div className="col-span-1">
              <Label>App Key</Label>
              <Input type="text" value={appKey} onChange={e => setAppKey(e.target.value)} />
            </div>
    
            <div className="col-span-1">
              <Label>App Secret</Label>
              <Input type="text" value={appSecret} onChange={e => setAppSecret(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Close
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    );
  }