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
  import React, {useCallback, useEffect, useState} from "react";
  import Label from "../form/Label";
import Input from "../form/input/InputField";
  import { useModal } from "@/hooks/useModal";
  import Select from "../form/Select";
  import {ChevronDownIcon, TrashBinIcon} from "@/icons";
import ConfirmDeleteModal from "@/components/ui/modal/ConfirmDeleteModal";
import axiosInstance from "@/utils/axiosInstance";
import {useAuth} from "@/context/authContext";
import {httpClient} from "@/lib/http-client";

  interface Shop {
    id: string;
    shopId: string;
    shopName: string | null;
    shopCipher: string | null;
    app:{
      appId: string;
      appKey: string;
      appSecret: string | null;
      appName: string | null;
    },
    country: string;
    status: string | null;
    createdAt: string;
  };

  interface App {
    id: string;
  appId: string;
  appKey: string;
  appSecret: string | null;
  appName: string | null;
    createdAt: string;
    isActive: boolean;
};

  export default function Shops() {
    const { user } = useAuth();
    const options = [
      { value: "US", label: "US" },
      { value: "UK", label: "UK" },
    ];
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedCountry, setSelectedCountry] = useState<{ value: string; label: string } | null>({ value: "UK", label: "UK" });
    const [showSecret, setShowSecret] = useState<{ [id: string]: boolean }>({});
    const [serviceId, setServiceId] = useState("");
    const [appName, setAppName] = useState("");
    const [appKey, setAppKey] = useState("");
    const [appSecret, setAppSecret] = useState("");
    const canDelete = user?.role === 'ADMIN';

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteAppModal, setShowDeleteAppModal] = useState(false);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [selectedApp, setSelectedApp] = useState<App | null>(null);
    const [showOffCanvas, setShowOffCanvas] = useState(false);
    const [appList, setAppList] = useState<App[]>([]);
    const [editingAppId, setEditingAppId] = useState<string | null>(null);
    const [editAppSecret, setEditAppSecret] = useState<string>("");

    const { isOpen, openModal, closeModal } = useModal();

    const fetchShops = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/tiktok/shop/get-shops");
        if (!res.ok) {
          const errorText = await res.text();
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || `Request failed with status ${res.status}`);
          } catch (e) {
            console.error("Non-JSON response from server:", errorText);
            throw new Error(`Server returned an unexpected response. Check console for details.`);
          }
        }
        const data = await res.json();
        // Giả sử API trả về một mảng các shop
        setShops(data.credentials || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
        console.error("❌ Error fetching shops:", err);
      } finally {
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchShops();
    }, [fetchShops]);

    const handleOpenOffCanvas = async () => {
      const res = await httpClient.get("/app");
      setAppList(res.app || []);
      setShowOffCanvas(true);
    };

    const resetForm = () => {
      setSelectedCountry(null);
      setServiceId("");
      setAppName("");
      setAppKey("");
      setAppSecret("");
    };

    const handleAppSave = async () => {
      try {
        const payload = {
          country: selectedCountry?.value, 
          serviceId,
          appName,
          appKey,
          appSecret,
        };
        const res = await httpClient.post("/tiktok/shop/add-shop-info", payload);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to save shop: ${errorText}`);
        }
        closeModal();
        resetForm();
        await fetchShops();
      } catch (err) {
        console.error("❌ Save shop error:", err);
      }
    };

    const handleCountrySelectChange = (value: string) => {
      const found = options.find(opt => opt.value === value) || null;
      setSelectedCountry(found);
    };

    const handleDelete = async (AppKey: string) => {
      try {
        await axiosInstance.delete(`/shops/${AppKey}`);
        //toast.success("Bank deleted successfully!");
        // Optional: refetch banks or update state
        await fetchShops();
      } catch (error) {
        //toast.error("Failed to delete bank");
        console.error("Delete error:", error);
      } finally {
        setShowDeleteModal(false);
      }
    };

    const handleEditAppSecret = (app: App) => {
      setEditingAppId(app.id);
      setEditAppSecret(app.appSecret || "");
    };

    const handleCancelEdit = () => {
      setEditingAppId(null);
      setEditAppSecret("");
    };

    const handleSaveAppSecret = async (Id: string) => {
      try {
        await httpClient.put(`/app/${Id}`, { appSecret: editAppSecret });
        const res = await httpClient.get("/app");
        setAppList(res.app || []);
        setEditingAppId(null);
        setEditAppSecret("");
      } catch (err) {
        console.error("Failed to update appSecret", err);
      }
    };

    const handleDeleteApp = async (Id: string) => {
      try {
        await httpClient.delete(`/app/${Id}`);
        const res = await httpClient.get("/app");
        setAppList(res.app || []);
        setEditingAppId(null);
        setEditAppSecret("");
      } catch (err) {
        console.error("Failed to delete app", err);
      }
    };

    const getStatusBadge = (status: string | null) => {
      const lowerStatus = status?.toLowerCase();
      switch (lowerStatus) {
        case "active":
        case 'live':
          return <Badge size="sm" color="success">{status}</Badge>;
        case 'jumio':
        case 'up doc':
          return <Badge size="sm" color="warning">{status}</Badge>;
        case 'inactive':
        case 'die 7 days':
        case 'shop closed':
          return <Badge size="sm" color="error">{status}</Badge>;
        default:
          return <Badge size="sm" color="dark">{status || 'Unknown'}</Badge>;
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
              Import App
            </button>
            <button onClick={() => handleOpenOffCanvas()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              App List
            </button>
            <button onClick={fetchShops} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Refresh
            </button>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">No</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Shop ID</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Shop Name</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Info</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created date</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Action</TableCell>
              </TableRow>
            </TableHeader>
  
            {/* Table Body */}
  
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="py-5 text-center text-gray-500">Loading...</TableCell></TableRow>
              ) : error ? (
                  <TableRow><TableCell colSpan={5} className="py-5 text-center text-red-500">Error: {error}</TableCell></TableRow>
              ) : shops.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-5 text-center text-gray-500">No credentials found.</TableCell></TableRow>
              ) : (
                  shops.map((shop, index) => (
                      <TableRow key={shop.id}>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{index + 1}</TableCell>
                        <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{shop.shopId || 'N/A'}</TableCell>
                        <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{shop.shopName || 'N/A'}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col space-y-1">
                            <span className="font-medium text-gray-500 text-theme-sm dark:text-white/90">Country: {shop.country}</span>
                            <span className="font-medium text-gray-500 text-theme-sm dark:text-white/90">Seller ID: {shop.app.appId}</span>
                            <span className="font-medium text-gray-500 text-theme-sm dark:text-white/90">App Key: {shop.app.appKey}</span>
                            <span className="font-medium text-gray-500 w-[450px] text-theme-sm dark:text-white/90 flex items-center">
                            App Secret:
                            <span className="ms-2">{showSecret[shop.id] ? shop.app.appSecret : "••••••••"}</span>
                            <button
                                type="button"
                                onClick={() => setShowSecret(prev => ({ ...prev, [shop.id]: !prev[shop.id] }))}
                                className="focus:outline-none ms-2"
                                aria-label={showSecret[shop.id] ? "Hide secret" : "Show secret"}
                            >
                              {/* SVG icons */}
                              {showSecret[shop.id] ? ( <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg> ) : ( <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-6.06M9.53 9.53A3.001 3.001 0 0 0 12 15a3 3 0 0 0 2.47-5.47" stroke="currentColor" strokeWidth="2"/><path d="m1 1 22 22" stroke="currentColor" strokeWidth="2"/></svg> )}
                            </button>
                        </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {getStatusBadge(shop.status)}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {new Date(shop.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                  setSelectedShop(shop);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-800 dark:text-red-400"
                                title="Xóa"
                            >
                              <TrashBinIcon className="w-6 h-6" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                  ))
              )}
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
            Import App
          </h4>
          <div className="w-1/3">
              <Label>Country</Label>
                <div className="relative">
                  <Select
                    options={options}
                    placeholder="Country"
                    onChange={handleCountrySelectChange}
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
            <Button size="sm" onClick={handleAppSave}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

        {showDeleteModal && selectedShop && canDelete && (
            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => handleDelete(selectedShop.shopId)}
                title="Xác nhận xóa Shop"
                message={`Bạn có chắc chắn muốn xóa Shop ${selectedShop.shopName}?`}
            />
        )}

        {showDeleteAppModal && selectedApp && canDelete && (
            <ConfirmDeleteModal
                isOpen={showDeleteAppModal}
                onClose={() => setShowDeleteAppModal(false)}
                onConfirm={() => handleDeleteApp(selectedApp?.id)}
                title="Xác nhận xóa App"
                message={`Bạn có chắc chắn muốn xóa App ${selectedApp.appName}?`}
            />
        )}

        {showOffCanvas && (
            <div className="fixed top-20 inset-0 z-50 flex">
              <div className="flex-1" onClick={() => setShowOffCanvas(false)} />
              <div className="w-[900px] bg-white dark:bg-gray-900 shadow-lg h-[calc(100vh-64px)] p-6 overflow-y-auto">
                <button
                    onClick={() => setShowOffCanvas(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white  text-4xl "
                    aria-label="Close"
                >
                  &times;
                </button>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">App List</h4>
                <Table className="mt-5">
                  <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                    <TableRow>
                      <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">No</TableCell>
                      <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">App Name</TableCell>
                      <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">App Key</TableCell>
                      <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">App Secret</TableCell>
                      <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                      <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created At</TableCell>
                      <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {appList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-5 text-center text-gray-500">No apps found.</TableCell>
                        </TableRow>
                    ) : (
                        appList.map((app, idx) => {
                          const isEditing = editingAppId === app.id;
                          return (
                              <TableRow key={app.id}>
                                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{idx + 1}</TableCell>
                                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{app.appName}</TableCell>
                                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{app.appKey}</TableCell>
                                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                                  {isEditing ? (
                                      <input
                                          type="text"
                                          value={editAppSecret}
                                          onChange={e => setEditAppSecret(e.target.value)}
                                          className="border rounded px-1 py-0.5 w-80"
                                      />
                                  ) : (
                                      app.appSecret
                                  )}
                                </TableCell>
                                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                                  {app.isActive ? <Badge size="sm" color="success">Active</Badge> : <Badge size="sm" color="error">Inactive</Badge>}
                                </TableCell>
                                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                  {new Date(app.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                  {isEditing ? (
                                      <>
                                        <button
                                            className="text-green-600 hover:text-green-800 mr-2"
                                            title="Save"
                                            onClick={() => handleSaveAppSecret(app.id)}
                                        >
                                          {/* Save Icon */}
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </button>
                                        <button
                                            className="text-gray-400 hover:text-gray-600 mr-2"
                                            title="Cancel"
                                            onClick={handleCancelEdit}
                                        >
                                          {/* Cancel Icon */}
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </button>

                                      </>
                                  ) : (
                                      <>
                                        <button
                                            className="text-yellow-500 hover:text-yellow-600 mr-2"
                                            title="Edit"
                                            onClick={() => handleEditAppSecret(app)}
                                        >
                                          {/* Edit Icon */}
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                                          </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                              setSelectedApp(app);
                                              setShowDeleteAppModal(true);
                                            }}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                                            title="Delete"
                                        >
                                          <TrashBinIcon className="w-6 h-6" />
                                        </button>
                                      </>
                                  )}
                                </TableCell>
                              </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
              </div>
        )}

      </div>
    );
  }