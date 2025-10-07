import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import 'leaflet/dist/leaflet.css';

interface DustbinMapProps {
  editable?: boolean;
}

function DraggableMarker({ dustbin, editable, onUpdate }: any) {
  const markerRef = useRef<any>(null);
  const map = useMap();

  const getIconColor = (percentage: number) => {
    if (percentage < 50) return '#22c55e'; // green
    if (percentage < 75) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const createCustomIcon = (fillPercentage: number) => {
    const color = getIconColor(fillPercentage);
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
          <text x="16" y="21" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${Math.round(fillPercentage)}</text>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker && editable) {
      const { lat, lng } = marker.getLatLng();
      onUpdate(dustbin.id, lat, lng);
    }
  };

  return (
    <Marker
      position={[dustbin.latitude, dustbin.longitude]}
      icon={createCustomIcon(dustbin.latestFillPercentage || 0)}
      draggable={editable}
      eventHandlers={{ dragend: handleDragEnd }}
      ref={markerRef}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-lg">{dustbin.dustbin_id}</h3>
          <p className="text-sm text-gray-600">{dustbin.institutions?.name}</p>
          <p className="text-sm">{dustbin.location_name}</p>
          <p className="text-sm font-semibold mt-2">
            Fill Level: <span style={{ color: getIconColor(dustbin.latestFillPercentage || 0) }}>{(dustbin.latestFillPercentage || 0).toFixed(1)}%</span>
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

export default function DustbinMap({ editable = false }: DustbinMapProps) {
  const [dustbins, setDustbins] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([28.6139, 77.2090]); // Default: Delhi
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

      if (role === 'admin' && profile?.institution_id) {
        query = query.eq('institution_id', profile.institution_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const dustbinsWithLatestReading = data?.map((dustbin) => {
        const latestReading = dustbin.readings?.[0];
        return {
          ...dustbin,
          latestFillPercentage: latestReading?.fill_percentage || 0,
        };
      });

      setDustbins(dustbinsWithLatestReading || []);

      // Set center to first dustbin or average of all
      if (dustbinsWithLatestReading && dustbinsWithLatestReading.length > 0) {
        const avgLat = dustbinsWithLatestReading.reduce((sum, d) => sum + d.latitude, 0) / dustbinsWithLatestReading.length;
        const avgLng = dustbinsWithLatestReading.reduce((sum, d) => sum + d.longitude, 0) / dustbinsWithLatestReading.length;
        setCenter([avgLat, avgLng]);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const subscribeToReadings = () => {
    const channel = supabase
      .channel('map-readings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'readings',
        },
        () => fetchDustbins()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleUpdatePosition = async (id: string, lat: number, lng: number) => {
    try {
      const { error } = await supabase
        .from('dustbins')
        .update({ latitude: lat, longitude: lng })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Dustbin location updated',
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

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="h-[600px] w-full">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            key={JSON.stringify(center)}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {dustbins.map((dustbin) => (
              <DraggableMarker
                key={dustbin.id}
                dustbin={dustbin}
                editable={editable}
                onUpdate={handleUpdatePosition}
              />
            ))}
          </MapContainer>
        </div>
        {editable && (
          <div className="p-4 bg-muted text-sm text-muted-foreground">
            Drag markers to update dustbin locations
          </div>
        )}
      </CardContent>
    </Card>
  );
}