import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Edit, Trash, Shield, UserPlus } from 'lucide-react';
import AddAdminDialog from './AddAdminDialog';

interface UserManagementProps {
  isAdmin?: boolean;
  isSuperuser?: boolean;
  isSupervisor?: boolean;
}

export default function UserManagement({ 
  isAdmin = false, 
  isSuperuser = false,
  isSupervisor = false 
}: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const { role, profile } = useUserRole();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [role, profile]);

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          institutions(name)
        `);

      // Fetch all profiles first
      let profilesQuery = query;
      
      if (isAdmin && profile?.institution_id) {
        profilesQuery = query.eq('institution_id', profile.institution_id);
      } else if (isSupervisor && profile?.institution_id) {
        profilesQuery = query.eq('institution_id', profile.institution_id);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      // Fetch user roles separately
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      const usersWithRoles = profiles?.map(p => ({
        ...p,
        user_roles: [{ role: rolesMap.get(p.id) || 'user' }]
      })) || [];

      // Filter based on role
      let filteredUsers = usersWithRoles;
      
      if (isAdmin) {
        // Admins can only see regular users in their institution
        filteredUsers = usersWithRoles.filter(u => u.user_roles[0].role === 'user');
      } else if (isSupervisor) {
        // Supervisors can only see admins in their institution
        filteredUsers = usersWithRoles.filter(u => u.user_roles[0].role === 'admin');
      }

      setUsers(filteredUsers);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'superuser':
        return 'bg-purple-500';
      case 'supervisor':
        return 'bg-orange-500';
      case 'admin':
        return 'bg-blue-500';
      case 'user':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6" />
          User Management
        </h2>
        
        {isSuperuser && (
          <Button onClick={() => setShowAddAdmin(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add New Admin
          </Button>
        )}
      </div>

      <AddAdminDialog
        open={showAddAdmin}
        onOpenChange={setShowAddAdmin}
        onSuccess={fetchUsers}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const userRole = user.user_roles?.[0]?.role || 'user';
          return (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{user.username}</span>
                  <Badge className={getRoleBadgeColor(userRole)}>
                    {userRole.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Institution</p>
                  <p className="font-medium">{user.institutions?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{user.id.slice(0, 8)}...</p>
                </div>
                {(isSuperuser || (isSupervisor && userRole === 'admin') || (isAdmin && userRole === 'user')) && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No users found</p>
        </div>
      )}
    </div>
  );
}