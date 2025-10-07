import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddAdminDialog({ open, onOpenChange, onSuccess }: AddAdminDialogProps) {
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [createNewInstitution, setCreateNewInstitution] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    institutionId: '',
    newInstitutionName: '',
  });

  useEffect(() => {
    if (open) {
      fetchInstitutions();
    }
  }, [open]);

  const fetchInstitutions = async () => {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setInstitutions(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let institutionId = formData.institutionId;

      // Create new institution if needed
      if (createNewInstitution && formData.newInstitutionName) {
        const { data: newInstitution, error: instError } = await supabase
          .from('institutions')
          .insert({ name: formData.newInstitutionName })
          .select()
          .single();

        if (instError) throw instError;
        institutionId = newInstitution.id;
      }

      if (!institutionId) {
        throw new Error('Please select or create an institution');
      }

      // Create the admin user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update profile with institution
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ institution_id: institutionId })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Assign admin role using the edge function
      const { error: roleError } = await supabase.functions.invoke('assign-role', {
        body: { userId: authData.user.id, role: 'admin' },
      });

      if (roleError) throw roleError;

      toast({
        title: 'Success',
        description: 'Admin account created successfully',
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        username: '',
        institutionId: '',
        newInstitutionName: '',
      });
      setCreateNewInstitution(false);
      onSuccess();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Admin
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 8 characters
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Institution *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateNewInstitution(!createNewInstitution)}
              >
                {createNewInstitution ? 'Select Existing' : 'Create New'}
              </Button>
            </div>

            {createNewInstitution ? (
              <Input
                placeholder="New Institution Name"
                value={formData.newInstitutionName}
                onChange={(e) => setFormData({ ...formData, newInstitutionName: e.target.value })}
                required
              />
            ) : (
              <Select
                value={formData.institutionId}
                onValueChange={(value) => setFormData({ ...formData, institutionId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              The new admin will be able to manage users, dustbins, and maps for their assigned institution only.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Admin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
