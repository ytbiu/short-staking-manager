import type { Metadata } from "next";
import { Header } from "./component/Header";
import { PageLoader } from "./component/PageLoader";
import "./globals.css";
import "antd/dist/reset.css";



export const metadata: Metadata = {
  title: "shor-staking-query",
  description: "shor-staking-query",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <PageLoader>{children}</PageLoader>
      </body>
    </html>
  );
}
