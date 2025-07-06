"use client";

import React, {Suspense, useEffect} from "react";
import {useRouter, useSearchParams} from "next/navigation";

/**
 * This component handles the core logic of processing the TikTok redirect.
 * It extracts the 'code' and sends it to our secure backend for processing.
 */
const TikTokCallbackHandler: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        debugger
        if (!searchParams) return;
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        const processTikTokAuth = async () => {
            if (error) {
                console.error(`Error from TikTok redirect: ${error}`);
                // Redirect with an error message
                router.push(`/shops?error=tiktok_auth_failed&message=${error}`);
                return;
            }

            // Check for the essential authorization code from TikTok
            if (code) {
                console.log("Received TikTok authorization code, sending to backend...");
                try {
                    const response = await fetch('/api/tiktok/exchange-token', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({code}),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to exchange token');
                    }

                    const data = await response.json();

                    console.log(`Token ${data}`)
                } catch (apiError: any) {
                    console.error("Failed to process TikTok auth:", apiError);
                    router.push(`/shops?error=tiktok_processing_failed&message=${apiError.message}`);
                }
            } else {
                // Handle cases where the page is loaded without a code.
                console.warn("TikTok callback page loaded without an auth 'code'.");
                router.push("/shops?error=tiktok_invalid_callback");
            }
        };

        processTikTokAuth();
    }, [searchParams, router]);

    // Display a loading indicator while the auth process is running.
    return <span>Loading</span>;
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