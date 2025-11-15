import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import SearchResults from '../Search/SearchResults';
import NotificationCenter from '../Notifications/NotificationCenter';
import { searchService } from '../../services/searchService';
import { notificationService } from '../../services/notificationService';

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ notes: [], journal: [], events: [], tasks: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const notificationContainerRef = useRef(null);

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

    // Load notification count
    const loadNotificationCount = () => {
      setUnreadCount(notificationService.getUnreadCount());
    };
    loadNotificationCount();
    const notificationInterval = setInterval(loadNotificationCount, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
      clearInterval(notificationInterval);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const results = searchService.searchAll(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
      setSelectedIndex(0);
    } else {
      setSearchResults({ notes: [], journal: [], events: [], tasks: [] });
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event) => {
      // Cmd/Ctrl+K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape to close search
      if (event.key === 'Escape' && showSearchResults) {
        setShowSearchResults(false);
        setSearchQuery('');
        searchInputRef.current?.blur();
      }

      // Arrow keys navigation
      if (showSearchResults && searchQuery.trim().length > 0) {
        const totalResults = searchService.getTotalCount(searchResults);
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % totalResults);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + totalResults) % totalResults);
        } else if (event.key === 'Enter' && totalResults > 0) {
          event.preventDefault();
          // Navigate to selected result
          const allResults = [
            ...(searchResults.notes || []).map(r => ({ ...r, type: 'note' })),
            ...(searchResults.journal || []).map(r => ({ ...r, type: 'journal' })),
            ...(searchResults.events || []).map(r => ({ ...r, type: 'event' })),
            ...(searchResults.tasks || []).map(r => ({ ...r, type: 'task' }))
          ];
          if (allResults[selectedIndex]) {
            const selectedResult = allResults[selectedIndex];
            setShowSearchResults(false);
            setSearchQuery('');
            
            // Navigate based on result type
            switch (selectedResult.type) {
              case 'note':
                navigate('/notes');
                break;
              case 'journal':
                navigate('/journal');
                break;
              case 'event':
                // Navigate to calendar with the event's date
                if (selectedResult.date) {
                  const eventDate = new Date(selectedResult.date);
                  const dateStr = eventDate.toISOString().split('T')[0];
                  navigate(`/calendar?date=${dateStr}`);
                } else {
                  navigate('/calendar');
                }
                break;
              case 'task':
                navigate('/tasks');
                break;
            }
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery, searchResults, showSearchResults, selectedIndex]);

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
            <div className="relative" ref={searchContainerRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                ref={searchInputRef}
                placeholder="Search notes, journal, events..."
                className="pl-9 h-9 w-64 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) {
                    setShowSearchResults(true);
                  }
                }}
              />
              {showSearchResults && searchQuery.trim().length > 0 && (
                <SearchResults
                  results={searchResults}
                  query={searchQuery}
                  onClose={() => {
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  selectedIndex={selectedIndex}
                  onSelectIndex={setSelectedIndex}
                />
              )}
            </div>
          </div>
          
          <div className="relative" ref={notificationContainerRef}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
              )}
            </Button>
            {showNotifications && (
              <NotificationCenter
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
