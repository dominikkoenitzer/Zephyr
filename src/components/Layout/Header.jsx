import React from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

function Header({ onMenuClick }) {
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };

  const timeOfDay = getTimeOfDay();

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-40 h-16 glass backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2 hover:scale-110 transition-transform"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-muted-foreground hidden md:block">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-foreground px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Good {timeOfDay}!</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
