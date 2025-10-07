import DashboardLayout from '@/components/layout/DashboardLayout';
import DustbinMap from '@/components/dustbins/DustbinMap';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MapPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Dustbin Map">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="h-[calc(100vh-250px)]">
          <DustbinMap />
        </div>
      </div>
    </DashboardLayout>
  );
}
