import DashboardLayout from '@/components/layout/DashboardLayout';
import DustbinMap from '@/components/dustbins/DustbinMap';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useState } from 'react';

export default function MapPage() {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const [editMode, setEditMode] = useState(false);
  const canEdit = role === 'superuser' || role === 'admin';

  return (
    <DashboardLayout title="Dustbin Map">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          {canEdit && (
            <Button
              variant={editMode ? 'default' : 'outline'}
              onClick={() => setEditMode(!editMode)}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {editMode ? 'Done Editing' : 'Edit Locations'}
            </Button>
          )}
        </div>
        
        <div className="h-[calc(100vh-250px)] relative">
          <DustbinMap editable={editMode} />
        </div>
      </div>
    </DashboardLayout>
  );
}
