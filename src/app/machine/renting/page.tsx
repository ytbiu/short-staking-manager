import { Metadata } from "next";
import RentingMachineList from "../../component/RentingMachineList";

export const metadata: Metadata = {
  title: "租用中机器列表",
  description: "显示当前正在租用中的机器列表",
};

export default function RentingMachinePage() {
  return <RentingMachineList />;
}