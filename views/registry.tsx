import React from 'react';
import { ViewComponentProps } from '../types';
import {
  Home,
  Settings,
  PieChart,
  Info,
  Phone,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';

export const HomeView: React.FC<ViewComponentProps> = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Home className="w-5 h-5" /> Welcome Home
      </CardTitle>
      <CardDescription>
        This is the main landing area. Select sub-pages below to navigate
        deeper into the Home namespace.
      </CardDescription>
    </CardHeader>
  </Card>
);

export const AboutView: React.FC<ViewComponentProps> = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Info className="w-5 h-5 text-emerald-500" /> About Us
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground leading-relaxed">
        We are exploring the capabilities of TanStack Router using a
        state-driven approach. Instead of URL paths, we are using query
        parameters to drive independent viewports.
      </p>
    </CardContent>
  </Card>
);

export const ContactView: React.FC<ViewComponentProps> = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold flex items-center gap-2">
      <Phone className="w-5 h-5 text-primary" /> Contact
    </h2>
    <form className="grid gap-3" onSubmit={(e) => e.preventDefault()}>
      <Input type="text" placeholder="Email" />
      <Textarea placeholder="Message" className="h-24" />
      <Button>Send Message</Button>
    </form>
  </div>
);

export const DashboardView: React.FC<ViewComponentProps> = () => (
  <div className="grid grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Active Users</CardDescription>
        <CardTitle className="text-3xl">1,234</CardTitle>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Revenue</CardDescription>
        <CardTitle className="text-3xl text-emerald-500">$45.2k</CardTitle>
      </CardHeader>
    </Card>
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" /> System Status:{' '}
          <Badge variant="secondary">Healthy</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={75} />
      </CardContent>
    </Card>
  </div>
);

export const StatsView: React.FC<ViewComponentProps> = () => (
  <Card className="border-dashed">
    <CardContent className="h-64 flex items-center justify-center">
      <div className="text-center">
        <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">
          Detailed statistics visualization placeholder
        </p>
      </div>
    </CardContent>
  </Card>
);

export const SettingsView: React.FC<ViewComponentProps> = () => (
  <div className="space-y-4">
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span>Notifications</span>
        </div>
        <Switch defaultChecked />
      </CardContent>
    </Card>
  </div>
);

export const HelpView: React.FC<ViewComponentProps> = () => (
  <Card>
    <CardContent className="p-8 text-center">
      <HelpCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Need Help?</h2>
      <p className="text-muted-foreground">
        Navigate using the buttons above to change the query parameters. Notice
        how this panel updates independently of the other.
      </p>
    </CardContent>
  </Card>
);

export const NotFoundView: React.FC<ViewComponentProps> = ({ currentPath }) => (
  <Card className="border-destructive">
    <CardContent className="p-6 text-center">
      <h3 className="text-destructive font-bold text-lg mb-2">
        View Not Found
      </h3>
      <p className="text-muted-foreground">
        The path <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{currentPath}</code> does
        not exist in the registry.
      </p>
    </CardContent>
  </Card>
);
