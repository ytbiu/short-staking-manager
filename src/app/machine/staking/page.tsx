import { StakingMachineList } from "@/app/component/StakingMachineList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "staking machines",
  description: "staking machines",
};

export default function StakingMachinesPage() {
  return (
    <StakingMachineList pageNo={1} pageSize={10} sortBy="totalClaimedRewardAmount" sortOrder="desc" />
  );
}
