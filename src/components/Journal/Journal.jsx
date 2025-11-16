import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Search, Trash2, Save, X, BookOpen, 
  Hash, Download, Upload, Calendar as CalendarIcon,
  Grid, List, Archive, ArchiveRestore, Target
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { localStorageService } from '../../services/localStorage';

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
  CALENDAR: 'calendar',
};

const Journal = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJournalEntry, setSelectedJournalEntry] = useState(null);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterTag, setFilterTag] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy] = useState('date'); // date, length
  const textareaRef = useRef(null);

  useEffect(() => {
    loadJournalEntries();
  }, []);

  const loadJournalEntries = () => {
    const loadedEntries = localStorageService.getJournalEntries();
    setJournalEntries(loadedEntries);
  };

  const filteredJournalEntries = useMemo(() => {
    let filtered = journalEntries;
    
    // Filter by archived status
    filtered = filtered.filter(entry => showArchived ? entry.archived : !entry.archived);
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.content.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by tag
    if (filterTag) {
      filtered = filtered.filter(entry =>
        entry.tags.some(tag => tag.toLowerCase() === filterTag.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'length':
          return b.content.length - a.content.length;
        default: // date
          return new Date(b.date) - new Date(a.date);
      }
    });
    
    return filtered;
  }, [journalEntries, searchQuery, filterTag, showArchived, sortBy]);

  const allTags = useMemo(() => {
    return [...new Set(journalEntries.flatMap(e => e.tags))];
  }, [journalEntries]);

  const calculateStreak = (entries) => {
    if (entries.length === 0) return 0;
    const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sorted.length; i++) {
      const entryDate = new Date(sorted[i].date);
      entryDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const stats = useMemo(() => {
    const totalEntries = journalEntries.length;
    const streak = calculateStreak(journalEntries);
    const thisMonth = journalEntries.filter(e => {
      const entryDate = new Date(e.date);
      const now = new Date();
      return entryDate.getMonth() === now.getMonth() && 
             entryDate.getFullYear() === now.getFullYear();
    }).length;
    
    return {
      total: totalEntries,
      thisMonth,
      streak,
      archived: journalEntries.filter(e => e.archived).length,
    };
  }, [journalEntries]);

  const handleCreateJournalEntry = () => {
    const entry = localStorageService.getJournalEntryByDate(selectedDate);
    if (entry) {
      setSelectedJournalEntry({ ...entry });
    } else {
      setSelectedJournalEntry({
        date: selectedDate,
        content: '',
        tags: [],
        archived: false,
      });
    }
    setIsJournalDialogOpen(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleSaveJournalEntry = () => {
    if (!selectedJournalEntry) return;
    
    if (selectedJournalEntry.id) {
      const updated = localStorageService.updateJournalEntry(selectedJournalEntry.id, selectedJournalEntry);
      if (updated) {
        loadJournalEntries();
        setIsJournalDialogOpen(false);
        setSelectedJournalEntry(null);
      }
    } else {
      const newEntry = localStorageService.addJournalEntry(selectedJournalEntry);
      if (newEntry) {
        loadJournalEntries();
        setIsJournalDialogOpen(false);
        setSelectedJournalEntry(null);
      }
    }
  };

  const handleDeleteJournalEntry = (entryId) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      localStorageService.deleteJournalEntry(entryId);
      loadJournalEntries();
      if (selectedJournalEntry?.id === entryId) {
        setIsJournalDialogOpen(false);
        setSelectedJournalEntry(null);
      }
    }
  };

  const handleEditJournalEntry = (entry) => {
    setSelectedJournalEntry({ ...entry });
    setSelectedDate(entry.date);
    setIsJournalDialogOpen(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleAddJournalTag = (tag) => {
    if (!selectedJournalEntry) return;
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedJournalEntry.tags.includes(trimmedTag)) {
      setSelectedJournalEntry({ ...selectedJournalEntry, tags: [...selectedJournalEntry.tags, trimmedTag] });
    }
  };

  const handleRemoveJournalTag = (tagToRemove) => {
    if (!selectedJournalEntry) return;
    setSelectedJournalEntry({
      ...selectedJournalEntry,
      tags: selectedJournalEntry.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleToggleArchive = (entryId) => {
    const entry = journalEntries.find(e => e.id === entryId);
    if (entry) {
      localStorageService.updateJournalEntry(entryId, { archived: !entry.archived });
      loadJournalEntries();
    }
  };

  const exportJournal = () => {
    const dataStr = JSON.stringify(journalEntries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJournal = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
              const existing = localStorageService.getJournalEntries();
              const merged = [...existing, ...imported];
              localStorage.setItem('zephyr_journal_entries', JSON.stringify(merged));
              loadJournalEntries();
              alert(`Imported ${imported.length} entries successfully!`);
            }
          } catch (error) {
            alert('Failed to import journal. Invalid file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);
    
    const diffTime = today - entryDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Journal</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {stats.total} entries • {stats.streak} day streak • {stats.thisMonth} this month
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={importJournal} className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9">
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportJournal} className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9">
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={handleCreateJournalEntry} size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">New Entry</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Entries</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold mt-0.5">{stats.total}</p>
              </div>
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary opacity-50 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Current Streak</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold mt-0.5">{stats.streak} <span className="text-xs sm:text-sm font-normal">days</span></p>
              </div>
              <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary opacity-50 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">This Month</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold mt-0.5">{stats.thisMonth}</p>
              </div>
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary opacity-50 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              id="journal-search"
              name="journal-search"
              placeholder="Search journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant={viewMode === VIEW_MODES.LIST ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode(VIEW_MODES.LIST)}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === VIEW_MODES.GRID ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode(VIEW_MODES.GRID)}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <Grid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="space-y-3">
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground flex-shrink-0">Tags:</span>
              <Button
                variant={filterTag === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTag('')}
                className="flex-shrink-0 text-xs sm:text-sm h-8 sm:h-9"
              >
                All
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={filterTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                  className="gap-1 flex-shrink-0 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Hash className="h-3 w-3" />
                  <span className="max-w-[100px] truncate">{tag}</span>
                </Button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="gap-2 text-xs sm:text-sm h-8 sm:h-9"
            >
              {showArchived ? <ArchiveRestore className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span className="hidden sm:inline">{showArchived ? 'Show Active' : 'Show Archived'}</span>
              <span className="sm:hidden">{showArchived ? 'Active' : 'Archived'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Journal Entries */}
      {filteredJournalEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No journal entries found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || filterTag
                ? 'Try adjusting your search or filters'
                : 'Start your journaling journey today'}
            </p>
            <Button onClick={handleCreateJournalEntry} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === VIEW_MODES.GRID 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          : "space-y-3 sm:space-y-4"
        }>
          {filteredJournalEntries.map(entry => {
            return (
              <Card
                key={entry.id}
                className={`hover-lift cursor-pointer transition-all group ${
                  viewMode === VIEW_MODES.LIST ? 'flex flex-col sm:flex-row items-start gap-2 sm:gap-4' : ''
                }`}
                onClick={() => handleEditJournalEntry(entry)}
              >
                <CardHeader className={`pb-3 ${viewMode === VIEW_MODES.LIST ? 'flex-1 min-w-0' : ''}`}>
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <CardTitle className="text-base sm:text-lg truncate">
                          {getRelativeDate(entry.date)}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                      {entry.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {entry.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {viewMode === VIEW_MODES.LIST && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2 whitespace-pre-wrap">
                          {entry.content || 'No content'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-8 sm:w-8"
                        aria-label={entry.archived ? "Unarchive entry" : "Archive entry"}
                        title={entry.archived ? "Unarchive entry" : "Archive entry"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleArchive(entry.id);
                        }}
                      >
                        {entry.archived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-8 sm:w-8 text-destructive"
                        aria-label="Delete entry"
                        title="Delete entry"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJournalEntry(entry.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {viewMode === VIEW_MODES.GRID && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-3 sm:line-clamp-4 whitespace-pre-wrap break-words">
                      {entry.content || 'No content'}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Journal Entry Dialog */}
      <Dialog open={isJournalDialogOpen} onOpenChange={setIsJournalDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Journal Entry</DialogTitle>
            <DialogDescription>
              Reflect on your day. Record your thoughts, feelings, and experiences.
            </DialogDescription>
          </DialogHeader>
          {selectedJournalEntry && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Date</label>
                <Input
                  id="journal-date"
                  name="journal-date"
                  type="date"
                  value={selectedJournalEntry.date}
                  onChange={(e) => setSelectedJournalEntry({ ...selectedJournalEntry, date: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Content</label>
                <textarea
                  ref={textareaRef}
                  value={selectedJournalEntry.content}
                  onChange={(e) => setSelectedJournalEntry({ ...selectedJournalEntry, content: e.target.value })}
                  placeholder="How was your day? What are you grateful for? What did you learn? What are your goals for tomorrow?"
                  className="w-full min-h-[250px] sm:min-h-[300px] md:min-h-[400px] px-3 py-2 rounded-md border border-input bg-background text-sm sm:text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Tags</label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {selectedJournalEntry.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveJournalTag(tag)}
                        className="hover:text-primary/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  id="journal-tag"
                  name="journal-tag"
                  placeholder="Add a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddJournalTag(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4 border-t border-border">
                <div className="flex gap-2 order-2 sm:order-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsJournalDialogOpen(false);
                      setSelectedJournalEntry(null);
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  {selectedJournalEntry.id && (
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteJournalEntry(selectedJournalEntry.id)}
                      className="text-destructive hover:text-destructive flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={handleSaveJournalEntry} 
                  className="gap-2 order-1 sm:order-2 flex-1 sm:flex-none"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save Entry</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Journal;
