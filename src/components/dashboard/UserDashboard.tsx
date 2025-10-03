import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DustbinList from '@/components/dustbins/DustbinList';
import DustbinMap from '@/components/dustbins/DustbinMap';

export default function UserDashboard() {
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <DashboardLayout title="User Dashboard">
      <div className="space-y-6">
        <div className="flex gap-2">
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

        {view === 'list' ? <DustbinList editable={false} /> : <DustbinMap editable={false} />}
      </div>
    </DashboardLayout>
  );
}