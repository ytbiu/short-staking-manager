import { Metadata } from "next";
import OfflineMachineList from "../../component/OfflineMachineList";

export const metadata: Metadata = {
  title: "离线机器列表",
  description: "查看当前离线的机器列表",
};

export default function OfflineMachinesPage() {
  return (
    <div>
      <OfflineMachineList />
    </div>
  );
}