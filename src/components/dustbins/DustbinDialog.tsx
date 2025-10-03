import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface DustbinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dustbin?: any;
  onSuccess: () => void;
}

export default function DustbinDialog({ open, onOpenChange, dustbin, onSuccess }: DustbinDialogProps) {
  const [dustbinId, setDustbinId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { role, profile } = useUserRole();
  const { toast } = useToast();

  useEffect(() => {
    fetchInstitutions();
    if (dustbin) {
      setDustbinId(dustbin.dustbin_id);
      setInstitutionId(dustbin.institution_id);
      setLatitude(dustbin.latitude.toString());
      setLongitude(dustbin.longitude.toString());
      setLocationName(dustbin.location_name || '');
    } else {
      resetForm();
    }
  }, [dustbin, open]);

  const fetchInstitutions = async () => {
    const { data } = await supabase.from('institutions').select('*');
    if (data) setInstitutions(data);
  };

  const resetForm = () => {
    setDustbinId('');
    setInstitutionId(role === 'admin' ? profile?.institution_id || '' : '');
    setLatitude('');
    setLongitude('');
    setLocationName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dustbinId || !institutionId || !latitude || !longitude) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    setLoading(true);

    try {
      const data = {
        dustbin_id: dustbinId,
        institution_id: institutionId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location_name: locationName || null,
      };

      if (dustbin) {
        const { error } = await supabase.from('dustbins').update(data).eq('id', dustbin.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Dustbin updated successfully' });
      } else {
        const { error } = await supabase.from('dustbins').insert(data);
        if (error) throw error;
        toast({ title: 'Success', description: 'Dustbin created successfully' });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dustbin ? 'Edit Dustbin' : 'Add New Dustbin'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dustbinId">Dustbin ID *</Label>
            <Input
              id="dustbinId"
              value={dustbinId}
              onChange={(e) => setDustbinId(e.target.value)}
              placeholder="BIN-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Institution *</Label>
            <Select
              value={institutionId}
              onValueChange={setInstitutionId}
              disabled={role === 'admin'}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="28.6139"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.2090"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationName">Location Name</Label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Main Gate, Building A"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}