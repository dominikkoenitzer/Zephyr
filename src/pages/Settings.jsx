import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Bell, Moon, Sun, Monitor, Sparkles, Zap, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';

function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
      <div className="space-y-4 animate-fade-in-up">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Customize your Zephyr experience
        </p>
      </div>

      {/* Notifications Card */}
      <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
            <div>
              <h3 className="font-medium text-foreground">Desktop Notifications</h3>
              <p className="text-sm text-muted-foreground">Get notified when sessions complete</p>
            </div>
            <Button
              variant={notifications ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications(!notifications)}
              className="rounded-full"
            >
              {notifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
            <div>
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Sound Effects
              </h3>
              <p className="text-sm text-muted-foreground">Play sounds on task completion</p>
            </div>
            <Button
              variant={sounds ? "default" : "outline"}
              size="sm"
              onClick={() => setSounds(!sounds)}
              className="rounded-full"
            >
              {sounds ? 'On' : 'Off'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Card */}
      <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 border-2 border-primary bg-primary/5 rounded-xl cursor-pointer hover:scale-105 transition-transform">
              <div className="flex flex-col items-center gap-3">
                <Sun className="h-8 w-8 text-primary" />
                <span className="font-medium">Light</span>
              </div>
            </div>
            
            <div className="p-6 border-2 border-border rounded-xl cursor-pointer hover:scale-105 transition-transform">
              <div className="flex flex-col items-center gap-3">
                <Moon className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Dark</span>
              </div>
            </div>
            
            <div className="p-6 border-2 border-border rounded-xl cursor-pointer hover:scale-105 transition-transform">
              <div className="flex flex-col items-center gap-3">
                <Monitor className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Auto</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Card */}
      <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            About Zephyr
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Zephyr</strong> is a next-generation productivity platform 
              that helps you achieve deep focus through Pomodoro sessions, intelligent task management, 
              and mindful planning.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold">Version:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-semibold">Tagline:</span>
              <span className="italic text-primary">"Flow Through Focus"</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pro Tip */}
      <div className="glass-card border-none p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-semibold text-lg mb-2">Pro Tip</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enable notifications to stay on track with your focus sessions. 
          Zephyr will gently remind you when it's time to work or take a break.
        </p>
      </div>
    </div>
  );
}

export default Settings;
