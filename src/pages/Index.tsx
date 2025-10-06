import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, MapPin, Users, BarChart3, Shield, Eye } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Hero Section */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">BinSense</h1>
              <p className="text-sm text-muted-foreground">Smart Waste Management Platform</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 space-y-16">
        {/* About Section */}
        <section className="text-center space-y-4 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Revolutionizing Waste Management with IoT
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            BinSense is a cutting-edge smart waste management platform that leverages IoT technology
            to monitor dustbin fill levels in real-time. Our system helps institutions optimize waste
            collection routes, reduce operational costs, and maintain cleaner environments.
          </p>
        </section>

        {/* How It Works */}
        <section className="space-y-8">
          <h3 className="text-3xl font-bold text-center text-foreground">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Trash2 className="h-12 w-12 text-primary mb-2" />
                <CardTitle>IoT Sensors</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  ESP8266-powered devices with ultrasonic sensors monitor fill levels and send
                  real-time data securely using HMAC authentication.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Real-time Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  View live data, analytics, and alerts through our intuitive web dashboard with
                  role-based access control.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Interactive Maps</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Visualize all dustbins on an interactive map with color-coded fill status indicators
                  for efficient route planning.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Institution Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Multi-level access control for institutions, admins, supervisors, and users ensures
                  secure and organized operations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Roles Explanation */}
        <section className="space-y-8">
          <h3 className="text-3xl font-bold text-center text-foreground">User Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-purple-500 mb-2" />
                <CardTitle className="flex items-center gap-2">
                  Superuser
                  <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">FULL ACCESS</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete system control: manage all institutions, users, dustbins, maps, and system settings.
                  Can view global analytics and audit logs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-orange-500 mb-2" />
                <CardTitle className="flex items-center gap-2">
                  Supervisor
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">INSTITUTION</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Can create one institution and assign admins. Manages institution-level operations including
                  adding/removing dustbins and viewing analytics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-500 mb-2" />
                <CardTitle className="flex items-center gap-2">
                  Admin
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">MANAGE</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manages users, dustbins, and maps within their assigned institution. Can add/remove users
                  and equipment but cannot affect supervisors.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Eye className="h-10 w-10 text-green-500 mb-2" />
                <CardTitle className="flex items-center gap-2">
                  User
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">VIEW ONLY</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  View-only access to dashboards, maps, and dustbin data. Can edit their own profile
                  (username, email, password) but cannot modify system data.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="text-center space-y-4 max-w-3xl mx-auto bg-card p-8 rounded-lg border border-border">
          <h3 className="text-2xl font-bold text-foreground">Our Mission</h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            To create sustainable, data-driven waste management solutions that empower institutions
            to operate efficiently while contributing to a cleaner environment. Through innovative IoT
            technology and intelligent analytics, we're building smarter cities one dustbin at a time.
          </p>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6 py-8">
          <h3 className="text-3xl font-bold text-foreground">Ready to Get Started?</h3>
          <p className="text-lg text-muted-foreground">
            Join institutions worldwide using BinSense for smarter waste management
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Create Account
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 BinSense. Smart Waste Management Platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
