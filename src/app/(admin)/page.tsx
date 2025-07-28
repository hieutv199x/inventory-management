// "use client";
// import React from "react";
// import { useEffect } from "react";
// import { useAuth } from "@/context/authContext";
// import Dashboard from "./(main-pages)/dashboard/page";
// import Loading from "@/components/Loading";
// import { useRouter } from "next/navigation";

// const Page: React.FC = () => {
//   const { isLoggedIn} = useAuth();

//   const router = useRouter();


//   if (isLoggedIn) {
//     return <Dashboard />;
//   }

//   useEffect(() => {
//     router.replace("/signin");
//   }, [router]);
// };

// export default Page;


"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "./(main-pages)/dashboard/page";
import { useAuth } from "@/context/authContext";
import Loading from "@/components/Loading";

interface PageProps {
  params: Promise<{ [key: string]: any }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const PageContent: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuth(); // Use isLoggedIn from useAuth

  // useEffect(() => {
  //   if (!isLoggedIn) {
  //     router.push("/signin");
  //   }
  // }, [isLoggedIn, router]);

  // if (isLoggedIn) {
  //   return <Dashboard />;
  // }

  // useEffect(() => {
  //   router.replace("/signin");
  // }, [router]);
  return <Dashboard />;
};

const Page: React.FC<PageProps> = ({ params, searchParams }) => {
  const [resolvedParams, setResolvedParams] = useState<{
    [key: string]: any;
  } | null>(null);
  const [resolvedSearchParams, setResolvedSearchParams] = useState<{
    [key: string]: string | string[] | undefined;
  } | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      setResolvedParams(await params);
      setResolvedSearchParams(await searchParams);
    };
    resolveParams();
  }, [params, searchParams]);

  if (!resolvedParams || !resolvedSearchParams) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <PageContent />
    </Suspense>
  );
};

export default Page;