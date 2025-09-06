"use client";

import React, {Suspense, useEffect, useState, useRef} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import { httpClient } from '@/lib/http-client';
import ShopNameModal from '@/components/TikTok/ShopNameModal';

/**
 * This component handles the core logic of processing the TikTok redirect.
 * It extracts the 'code' and sends it to our secure backend for processing.
 */
const TikTokCallbackHandler: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showShopNameModal, setShowShopNameModal] = useState(false);
    const [shopData, setShopData] = useState<{shopId: string, shopName: string} | null>(null);
    const processedRef = useRef(false);

    useEffect(() => {
        // Prevent duplicate execution in React Strict Mode
        if (processedRef.current) return;
        
        if (!searchParams) return;
        
        const app_key = searchParams.get("app_key");
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        const processTikTokAuth = async () => {
            // Mark as processed immediately to prevent race conditions
            processedRef.current = true;
            
            if (error) {
                console.error(`Error from TikTok redirect: ${error}`);
                setErrorMessage(error);
                setStatus("error");
                return;
            }

            if (code && app_key) {
                console.log("Received TikTok authorization code, sending to backend...");
                try {
                    const data = await httpClient.post('/tiktok/exchange-token', {
                        code,
                        app_key
                    });

                    console.log('Token data:', data);
                    if (Array.isArray(data) && data.length > 0 && data[0].cipher) {
                        const shopInfo = data[0];
                        setShopData({
                            shopId: shopInfo.id || shopInfo.cipher,
                            shopName: shopInfo.name || 'TikTok Shop'
                        });
                        setStatus("success");
                        setShowShopNameModal(true);
                    } else {
                        throw new Error("Invalid token response");
                    }
                } catch (apiError: any) {
                    console.error("Failed to process TikTok auth:", apiError);
                    setErrorMessage(apiError.message || "Unknown error");
                    setStatus("error");
                }
            } else {
                // Handle cases where the page is loaded without a code.
                console.warn("TikTok callback page loaded without an auth 'code'.");
                setErrorMessage("Invalid callback (missing code).");
                setStatus("error");
            }
        };

        processTikTokAuth();
    }, [searchParams]);

    const handleShopNameSubmit = async (managedName: string) => {
        try {
            await httpClient.post('/tiktok/update-shop-name', {
                shopId: shopData?.shopId,
                managedName: managedName
            });
            
            setShowShopNameModal(false);
            // Redirect to shops page or dashboard
            setTimeout(() => {
                router.push('/shops');
            }, 1000);
        } catch (error: any) {
            throw new Error(error.message || 'Failed to update shop name');
        }
    };

    const handleCloseModal = () => {
        setShowShopNameModal(false);
        // Redirect even if user skips naming
        setTimeout(() => {
            router.push('/shops');
        }, 1000);
    };

    if (status === "loading") return <span>Loading...</span>;
    
    if (status === "success") {
        return (
            <>
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-green-600">✔ TikTok Connected Successfully!</h2>
                    <p className="mt-2 text-gray-600">Your shop has been linked to your account.</p>
                    {!showShopNameModal && (
                        <p className="mt-4 text-sm text-gray-500">Redirecting to shops page...</p>
                    )}
                </div>
                
                <ShopNameModal
                    isOpen={showShopNameModal}
                    onClose={handleCloseModal}
                    onSubmit={handleShopNameSubmit}
                    shopData={shopData}
                />
            </>
        );
    }

    if (status === "error") {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-red-600">✖ Failed to connect TikTok</h2>
                <p className="mt-2 text-gray-600">Reason: {errorMessage}</p>
                <button 
                    onClick={() => router.push('/shops')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Return to Shops
                </button>
            </div>
        );
    }
    
    return null;
};

/**
 * The main page component.
 * It uses Suspense to handle the asynchronous loading of search parameters.
 */
const TikTokCallbackPage: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <Suspense fallback={<span>Loading</span>}>
                <TikTokCallbackHandler/>
            </Suspense>
        </div>
    );
};

export default TikTokCallbackPage;