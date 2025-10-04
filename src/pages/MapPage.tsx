import DashboardLayout from '@/components/layout/DashboardLayout';
import DustbinMap from '@/components/dustbins/DustbinMap';

export default function MapPage() {
  return (
    <DashboardLayout title="Dustbin Map">
      <div className="h-[calc(100vh-200px)]">
        <DustbinMap />
      </div>
    </DashboardLayout>
  );
}
