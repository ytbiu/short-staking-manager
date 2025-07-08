"use client";
import { Spin, Card } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

interface LoadingProps {
  size?: "small" | "default" | "large";
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Loading({
  size = "large",
  tip = "加载中...",
  spinning = true,
  children,
  style,
}: LoadingProps) {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  if (children) {
    return (
      <Spin spinning={spinning} tip={tip} indicator={antIcon} size={size}>
        {children}
      </Spin>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
        ...style,
      }}
    >
      <Card
        style={{
          textAlign: "center",
          border: "none",
          boxShadow: "none",
        }}
      >
        <Spin indicator={antIcon} size={size} />
        <div style={{ marginTop: "16px", color: "#666" }}>{tip}</div>
      </Card>
    </div>
  );
}

// 全屏加载组件
export function FullScreenLoading({ tip = "页面加载中..." }: { tip?: string }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
        zIndex: 99999,
      }}
    >
      <Card
        style={{
          textAlign: "center",
          padding: "40px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
          size="large"
        />
        <div style={{ marginTop: "20px", fontSize: "16px", color: "#666" }}>
          {tip}
        </div>
      </Card>
    </div>
  );
}