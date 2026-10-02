"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./../components/Toast";
import { seedDefaultLocalData } from "@/lib/localDb";
import { initClientApiInterceptor } from "@/lib/clientApiInterceptor";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initClientApiInterceptor();
    seedDefaultLocalData();
  }, []);

  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
