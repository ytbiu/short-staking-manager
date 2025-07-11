"use client";
import { useEffect } from "react";
import { FullScreenLoading } from "./Loading";
import { usePageLoaderStore } from "@/app/stores/pageLoaderStore";

export function PageLoader({ children }: { children: React.ReactNode }) {
  const { isLoading, finishLoading } = usePageLoaderStore();

  useEffect(() => {
    // 确保页面完全加载后再隐藏loading
    const timer = setTimeout(() => {
      finishLoading();
    }, 100);

    return () => clearTimeout(timer);
  }, [finishLoading]);

  if (isLoading) {
    return <FullScreenLoading tip="页面加载中，请稍候..." />;
  }

  return <>{children}</>;
}