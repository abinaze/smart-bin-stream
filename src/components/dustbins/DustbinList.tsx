import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Edit, Trash, MapPin, Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DustbinDialog from './DustbinDialog';

interface DustbinListProps {
  editable?: boolean;
}

export default function DustbinList({ editable = false }: DustbinListProps) {
  const [dustbins, setDustbins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDustbin, setSelectedDustbin] = useState<any>(null);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());
  const { role, profile } = useUserRole();
  const { toast } = useToast();

  useEffect(() => {
    fetchDustbins();
    subscribeToReadings();
  }, [role, profile]);

  const fetchDustbins = async () => {
    try {
      let query = supabase
        .from('dustbins')
        .select(`
          *,
          institutions(name),
          readings(fill_percentage, created_at)
        `)
        .order('created_at', { ascending: false });

      // Filter by institution for admins
      if (role === 'admin' && profile?.institution_id) {
        query = query.eq('institution_id', profile.institution_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get latest reading for each dustbin
      const dustbinsWithLatestReading = data?.map((dustbin) => {
        const latestReading = dustbin.readings?.[0];
        return {
          ...dustbin,
          latestFillPercentage: latestReading?.fill_percentage || 0,
        };
      });

      setDustbins(dustbinsWithLatestReading || []);
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

  const subscribeToReadings = () => {
    const channel = supabase
      .channel('readings-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'readings',
        },
        (payload) => {
          fetchDustbins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dustbin?')) return;

    try {
      const { error } = await supabase.from('dustbins').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Dustbin deleted successfully',
      });
      fetchDustbins();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const getFillLevelColor = (percentage: number) => {
    if (percentage < 50) return 'text-success';
    if (percentage < 75) return 'text-warning';
    return 'text-danger';
  };

  const getFillLevelBadge = (percentage: number) => {
    if (percentage < 50) return <Badge className="bg-success">Low</Badge>;
    if (percentage < 75) return <Badge className="bg-warning">Medium</Badge>;
    return <Badge className="bg-danger">High</Badge>;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
  };

  const toggleApiKeyVisibility = (dustbinId: string) => {
    setVisibleApiKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dustbinId)) {
        newSet.delete(dustbinId);
      } else {
        newSet.add(dustbinId);
      }
      return newSet;
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading dustbins...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Dustbin Monitoring</h2>
        {editable && (
          <Button onClick={() => { setSelectedDustbin(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dustbin
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dustbins.map((dustbin) => (
          <Card key={dustbin.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className={`h-5 w-5 ${getFillLevelColor(dustbin.latestFillPercentage)}`} />
                  <span className="text-lg">{dustbin.dustbin_id}</span>
                </div>
                {getFillLevelBadge(dustbin.latestFillPercentage)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Institution</p>
                <p className="font-medium">{dustbin.institutions?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3" />
                  <span>{dustbin.location_name || `${dustbin.latitude}, ${dustbin.longitude}`}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Fill Level</p>
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      dustbin.latestFillPercentage < 50
                        ? 'bg-success'
                        : dustbin.latestFillPercentage < 75
                        ? 'bg-warning'
                        : 'bg-danger'
                    }`}
                    style={{ width: `${dustbin.latestFillPercentage}%` }}
                  />
                </div>
                <p className={`text-right text-sm font-bold mt-1 ${getFillLevelColor(dustbin.latestFillPercentage)}`}>
                  {dustbin.latestFillPercentage.toFixed(1)}%
                </p>
              </div>
              {editable && (role === 'superuser' || role === 'admin') && (
                <div className="space-y-2 pt-2 border-t mt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Dustbin Code</label>
                    <div className="flex gap-2">
                      <Input 
                        value={dustbin.dustbin_code} 
                        readOnly 
                        className="font-mono text-xs h-8"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(dustbin.dustbin_code, 'Dustbin Code')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">API Key</label>
                    <div className="flex gap-2">
                      <Input 
                        value={visibleApiKeys.has(dustbin.id) ? dustbin.api_key : '••••••••-••••-••••-••••-••••••••••••'} 
                        readOnly 
                        className="font-mono text-xs h-8"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => toggleApiKeyVisibility(dustbin.id)}
                      >
                        {visibleApiKeys.has(dustbin.id) ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(dustbin.api_key, 'API Key')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {editable && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDustbin(dustbin);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(dustbin.id)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {dustbins.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No dustbins found</p>
        </div>
      )}

      {editable && (
        <DustbinDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          dustbin={selectedDustbin}
          onSuccess={fetchDustbins}
        />
      )}
    </div>
  );
}