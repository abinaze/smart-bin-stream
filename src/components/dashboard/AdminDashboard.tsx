import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trash2 } from 'lucide-react';
import UserManagement from '@/components/management/UserManagement';
import DustbinList from '@/components/dustbins/DustbinList';
import DustbinMap from '@/components/dustbins/DustbinMap';

export default function AdminDashboard() {
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <DashboardLayout title="Admin Dashboard">
      <Tabs defaultValue="dustbins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="dustbins">
            <Trash2 className="h-4 w-4 mr-2" />
            Manage Dustbins
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Manage Users
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

          <div>
            {view === 'list' && <DustbinList editable={true} />}
            {view === 'map' && <DustbinMap editable={true} key="admin-map" />}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement isAdmin={true} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}