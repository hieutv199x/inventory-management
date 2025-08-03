"use client";

import React, {Suspense, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";

/**
 * This component handles the core logic of processing the TikTok redirect.
 * It extracts the 'code' and sends it to our secure backend for processing.
 */
const TikTokCallbackHandler: React.FC = () => {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!searchParams) return;
        const app_key = searchParams.get("app_key");
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        const processTikTokAuth = async () => {
            if (error) {
                console.error(`Error from TikTok redirect: ${error}`);
                setErrorMessage(error);
                setStatus("error");
                return;
            }

            if (code && app_key) {
                console.log("Received TikTok authorization code, sending to backend...");
                try {
                    const response = await fetch('/api/tiktok/exchange-token', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({code, app_key}),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to exchange token');
                    }

                    const data = await response.json();

                    console.log('Token data:', data);
                    if (Array.isArray(data) && data.length > 0 && data[0].cipher) {
                        setStatus("success");
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

    if (status === "loading") return <span>Loading...</span>;
    if (status === "success") {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-green-600">✔ TikTok Connected Successfully!</h2>
                <p className="mt-2 text-gray-600">Your shop has been linked to your account.</p>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-red-600">✖ Failed to connect TikTok</h2>
                <p className="mt-2 text-gray-600">Reason: {errorMessage}</p>
            </div>
        );
    }
    // Display a loading indicator while the auth process is running.
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