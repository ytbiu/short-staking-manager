import { StakingMachineList } from "@/app/component/stakingMachineList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "staking machines",
  description: "staking machines",
};

export default function StakingMachines() {
  return (
    <StakingMachineList pageNo={1} pageSize={10} sortBy="totalClaimedRewardAmount" sortOrder="desc" />
  );
}
