import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Trash2, LogOut, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const { role, profile } = useUserRole();

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'superuser':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'admin':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'user':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">BinSense</h1>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium text-foreground">{profile?.username || user?.email}</p>
                <Badge className={getRoleBadgeColor()}>
                  {role?.toUpperCase()}
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={signOut} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}