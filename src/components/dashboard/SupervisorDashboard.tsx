import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Trash2 } from 'lucide-react';
import UserManagement from '@/components/management/UserManagement';
import DustbinList from '@/components/dustbins/DustbinList';
import DustbinMap from '@/components/dustbins/DustbinMap';

export default function SupervisorDashboard() {
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <DashboardLayout title="Supervisor Dashboard">
      <Tabs defaultValue="dustbins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="dustbins">
            <Trash2 className="h-4 w-4 mr-2" />
            Manage Dustbins
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Users className="h-4 w-4 mr-2" />
            Manage Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dustbins" className="space-y-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'map'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Map View
            </button>
          </div>

          {view === 'list' ? <DustbinList editable={true} /> : <DustbinMap editable={true} />}
        </TabsContent>

        <TabsContent value="admins" className="space-y-6">
          <UserManagement isSupervisor={true} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
