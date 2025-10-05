import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Trash2, LogOut, User, LayoutDashboard, Map, Trash, Info, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const { role, profile } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'superuser':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'admin':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'supervisor':
        return 'bg-orange-500 hover:bg-orange-600';
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

      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <Button
              variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={location.pathname === '/map' ? 'default' : 'ghost'}
              onClick={() => navigate('/map')}
              className="gap-2"
            >
              <Map className="h-4 w-4" />
              Map
            </Button>
            <Button
              variant={location.pathname === '/dustbins' ? 'default' : 'ghost'}
              onClick={() => navigate('/dustbins')}
              className="gap-2"
            >
              <Trash className="h-4 w-4" />
              Dustbins
            </Button>
            <Button
              variant={location.pathname === '/about' ? 'default' : 'ghost'}
              onClick={() => navigate('/about')}
              className="gap-2"
            >
              <Info className="h-4 w-4" />
              About
            </Button>
            <Button
              variant={location.pathname === '/profile' ? 'default' : 'ghost'}
              onClick={() => navigate('/profile')}
              className="gap-2"
            >
              <UserCircle className="h-4 w-4" />
              Profile
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}