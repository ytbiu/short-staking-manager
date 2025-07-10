import type { Metadata } from "next";
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "质押机器列表",
  description: "质押机器列表",
};

export default function Home() {
  redirect('/machine/staking');
}
