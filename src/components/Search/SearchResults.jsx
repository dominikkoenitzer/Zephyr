import { useNavigate } from 'react-router-dom';
import { FileText, BookOpen, Calendar, CheckSquare, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const SearchResults = ({ results, query, onClose, selectedIndex, onSelectIndex }) => {
  const navigate = useNavigate();
  const totalCount = (results.notes?.length || 0) + 
                     (results.journal?.length || 0) + 
                     (results.events?.length || 0) + 
                     (results.tasks?.length || 0);

  if (!query || query.trim().length === 0 || totalCount === 0) {
    return null;
  }

  const handleResultClick = (type, item) => {
    onClose();
    
    switch (type) {
      case 'note':
        navigate('/notes');
        // Could dispatch event to open note editor
        break;
      case 'journal':
        navigate('/journal');
        break;
      case 'event':
        // Navigate to calendar with the event's date
        if (item.date) {
          const eventDate = new Date(item.date);
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
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatEventDate = (dateString, time) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    return time ? `${dateStr} at ${time}` : dateStr;
  };

  let currentIndex = 0;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg max-h-[500px] overflow-y-auto z-50">
      <div className="p-2">
        {results.notes && results.notes.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Notes ({results.notes.length})
            </div>
            {results.notes.slice(0, 5).map((note) => {
              const index = currentIndex++;
              return (
                <button
                  key={note.id}
                  onClick={() => handleResultClick('note', note)}
                  onMouseEnter={() => onSelectIndex(index)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors",
                    selectedIndex === index
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  )}
                >
                  <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {note.title || 'Untitled Note'}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {note.content || 'No content'}
                    </div>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {note.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {results.journal && results.journal.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Journal ({results.journal.length})
            </div>
            {results.journal.slice(0, 5).map((entry) => {
              const index = currentIndex++;
              return (
                <button
                  key={entry.id}
                  onClick={() => handleResultClick('journal', entry)}
                  onMouseEnter={() => onSelectIndex(index)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors",
                    selectedIndex === index
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  )}
                >
                  <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {formatDate(entry.date)}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {entry.content || 'No content'}
                    </div>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {entry.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {results.events && results.events.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Events ({results.events.length})
            </div>
            {results.events.slice(0, 5).map((event) => {
              const index = currentIndex++;
              return (
                <button
                  key={event.id}
                  onClick={() => handleResultClick('event', event)}
                  onMouseEnter={() => onSelectIndex(index)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors",
                    selectedIndex === index
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  )}
                >
                  <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatEventDate(event.date, event.time)}
                    </div>
                    {event.location && (
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        📍 {event.location}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {results.tasks && results.tasks.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tasks ({results.tasks.length})
            </div>
            {results.tasks.slice(0, 5).map((task) => {
              const index = currentIndex++;
              return (
                <button
                  key={task.id}
                  onClick={() => handleResultClick('task', task)}
                  onMouseEnter={() => onSelectIndex(index)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors",
                    selectedIndex === index
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  )}
                >
                  <CheckSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {task.description}
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Due: {formatDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {totalCount > 20 && (
          <div className="px-3 py-2 text-xs text-center text-muted-foreground border-t border-border mt-2">
            Showing top 20 results. Refine your search for more specific results.
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

