import type { Metadata } from "next";
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "机器列表",
  description: "机器列表",
};

export default function Home() {
  redirect('/machine/staking');
}
