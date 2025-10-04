import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Target, Users } from 'lucide-react';

export default function About() {
  return (
    <DashboardLayout title="About BinSense">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trash2 className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">About BinSense</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground">
              BinSense is an innovative IoT-based smart waste management platform designed to revolutionize
              how institutions monitor and manage their waste collection systems.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Our Purpose</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Traditional waste management systems rely on fixed schedules, often leading to inefficient
              collection routes, overflowing bins, or unnecessary trips to empty bins that aren't full.
            </p>
            <p>
              BinSense solves this by providing real-time fill level monitoring using IoT sensors, enabling:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Smart, data-driven collection schedules</li>
              <li>Reduced operational costs and carbon footprint</li>
              <li>Prevention of overflow situations</li>
              <li>Optimized collection routes</li>
              <li>Better resource allocation</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>
              To empower institutions with smart technology that makes waste management more efficient,
              sustainable, and cost-effective. We believe that intelligent monitoring systems are key to
              creating cleaner, more sustainable environments for educational institutions, corporate
              campuses, and public facilities.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">How It Works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold">1. IoT Sensors</h4>
              <p className="text-muted-foreground">
                ESP8266-based devices with ultrasonic sensors monitor fill levels in real-time and
                communicate data wirelessly to our platform.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. Real-Time Dashboard</h4>
              <p className="text-muted-foreground">
                View all your dustbins on an interactive map with color-coded status indicators
                (Green: 0-50%, Yellow: 50-75%, Red: 75-100%).
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. Role-Based Access</h4>
              <p className="text-muted-foreground">
                Superusers manage entire systems, admins oversee their institutions, and users can
                monitor status in their areas.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">4. Smart Alerts</h4>
              <p className="text-muted-foreground">
                Get notified when bins reach critical levels, enabling proactive waste collection.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Technology Stack</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Hardware</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• NodeMCU ESP8266</li>
                  <li>• Ultrasonic Sensors (HC-SR04)</li>
                  <li>• RGB LED Indicators</li>
                  <li>• Wi-Fi Connectivity</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Software</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• React + TypeScript</li>
                  <li>• Lovable Cloud Backend</li>
                  <li>• Real-time Database</li>
                  <li>• Interactive Maps (Leaflet)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-center text-lg">
              <span className="font-semibold">BinSense</span> - Making waste management smarter, one bin at a time.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
