import DashboardLayout from '@/components/layout/DashboardLayout';
import DustbinList from '@/components/dustbins/DustbinList';

export default function DustbinsPage() {
  return (
    <DashboardLayout title="Dustbin Management">
      <DustbinList />
    </DashboardLayout>
  );
}
