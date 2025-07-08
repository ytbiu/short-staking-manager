"use client";
import { useEffect, useState } from "react";
import { FullScreenLoading } from "./Loading";

export function PageLoader({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 确保页面完全加载后再隐藏loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <FullScreenLoading tip="页面加载中，请稍候..." />;
  }

  return <>{children}</>;
}