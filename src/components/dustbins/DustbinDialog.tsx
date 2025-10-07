import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Copy, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DustbinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dustbin?: any;
  onSuccess: () => void;
}

export default function DustbinDialog({ open, onOpenChange, dustbin, onSuccess }: DustbinDialogProps) {
  const [dustbinCode, setDustbinCode] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [deviceSecret, setDeviceSecret] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { role, profile } = useUserRole();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchInstitutions();
    if (dustbin) {
      setDustbinCode(dustbin.dustbin_code);
      setInstitutionId(dustbin.institution_id);
      setLatitude(dustbin.latitude.toString());
      setLongitude(dustbin.longitude.toString());
      setLocationName(dustbin.location_name || '');
      setWifiSsid(dustbin.wifi_ssid || '');
      setModuleId(dustbin.module_id || '');
      setApiEndpoint(dustbin.api_endpoint || '');
      setApiKey(dustbin.api_key || '');
    } else {
      resetForm();
    }
  }, [dustbin, open]);

  const fetchInstitutions = async () => {
    const { data } = await supabase.from('institutions').select('*');
    if (data) setInstitutions(data);
  };

  const resetForm = () => {
    setDustbinCode('');
    setInstitutionId(role === 'admin' ? profile?.institution_id || '' : '');
    setLatitude('');
    setLongitude('');
    setLocationName('');
    setWifiSsid('');
    setModuleId('');
    setApiEndpoint('');
    setApiKey('');
    setDeviceSecret('');
    setShowSecrets(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dustbinCode || !institutionId || !latitude || !longitude) {
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
        dustbin_id: dustbinCode,
        dustbin_code: dustbinCode,
        institution_id: institutionId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location_name: locationName || null,
        wifi_ssid: wifiSsid || null,
        module_id: moduleId || null,
        api_endpoint: apiEndpoint || null,
        created_by: user?.id,
      };

      if (dustbin) {
        const { error } = await supabase.from('dustbins').update(data).eq('id', dustbin.id);
        if (error) throw error;
        
        // Log audit event
        await supabase.rpc('log_audit_event', {
          p_user_id: user!.id,
          p_action: 'dustbin_updated',
          p_resource_type: 'dustbin',
          p_resource_id: dustbin.id,
          p_details: { dustbin_code: dustbinCode }
        });
        
        toast({ title: 'Success', description: 'Dustbin updated successfully' });
      } else {
        // Generate device secret (random 32-char string)
        const secret = crypto.randomUUID() + crypto.randomUUID();
        
        const { data: newDustbin, error } = await supabase
          .from('dustbins')
          .insert({
            ...data,
            device_secret: secret
          })
          .select()
          .single();
          
        if (error) throw error;
        
        setApiKey(newDustbin.api_key);
        setDeviceSecret(secret);
        setShowSecrets(true);
        
        // Log audit event
        await supabase.rpc('log_audit_event', {
          p_user_id: user!.id,
          p_action: 'dustbin_created',
          p_resource_type: 'dustbin',
          p_resource_id: newDustbin.id,
          p_details: { dustbin_code: dustbinCode }
        });
        
        toast({ 
          title: 'Success', 
          description: 'Dustbin created! SAVE THE DEVICE SECRET NOW - you won\'t see it again!' 
        });
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
            <Label htmlFor="dustbinCode">Dustbin Code *</Label>
            <Input
              id="dustbinCode"
              value={dustbinCode}
              onChange={(e) => setDustbinCode(e.target.value)}
              placeholder="BIN-001"
              required
              disabled={!!dustbin}
            />
          </div>

          {(apiKey || deviceSecret) && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>CRITICAL: Save these credentials now!</strong> The device secret will NEVER be shown again.
                You need both the API Key and Device Secret to configure your ESP8266.
              </AlertDescription>
            </Alert>
          )}

          {apiKey && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input 
                  value={apiKey} 
                  readOnly 
                  className="font-mono text-sm" 
                  type={showSecrets ? 'text' : 'password'}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(apiKey, 'API Key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {deviceSecret && (
            <div className="space-y-2 p-4 bg-red-50 dark:bg-red-950 border-2 border-red-500 rounded-lg">
              <Label className="text-red-800 dark:text-red-200">Device Secret (COPY NOW - shown only once!)</Label>
              <div className="flex gap-2">
                <Input 
                  value={deviceSecret} 
                  readOnly 
                  className="font-mono text-sm border-red-300" 
                  type={showSecrets ? 'text' : 'password'}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(deviceSecret, 'Device Secret')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                Use this secret in your ESP8266 code for HMAC authentication. Store it securely!
              </p>
            </div>
          )}

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

          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-semibold">IoT Device Configuration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="wifiSsid">WiFi SSID</Label>
              <Input
                id="wifiSsid"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="MyWiFiNetwork"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moduleId">Module ID</Label>
              <Input
                id="moduleId"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                placeholder="ESP8266-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">API Endpoint</Label>
              <Input
                id="apiEndpoint"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.example.com/update"
              />
            </div>
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