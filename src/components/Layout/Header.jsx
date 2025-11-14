import { Menu } from 'lucide-react';
import { Button } from '../ui/button';

function Header({ onMenuClick }) {
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
        </div>
      </div>
    </header>
  );
}

export default Header;
