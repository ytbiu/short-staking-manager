import { Card } from 'antd';
import MachineDetail from '@/app/component/MachineDetail';
import MachineReportList from '@/app/component/MachineReportList';
import MachineSlashedList from '@/app/component/MachineSlashedList';

export default async function MachineDetailPage({params}: {params: Promise<{machineId: string}>}) {
  const { machineId } = await params;

  return (
    <div style={{ padding: '20px' }}>
      <Card title="机器详情" style={{ marginBottom: '20px' }}>
        <p><strong>机器ID:</strong> {machineId}</p>
      </Card>

      <MachineDetail machineId={machineId} />
      <MachineReportList machineId={machineId} />
      <MachineSlashedList machineId={machineId} />
    </div>
  );
}