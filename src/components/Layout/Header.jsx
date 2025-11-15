import { useState, useEffect } from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

function Header({ onMenuClick }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const hour = now.getHours();
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-72 z-40 h-16 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:block">
            <div className="text-sm font-medium text-foreground">{greeting}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 w-64 text-sm"
              />
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
