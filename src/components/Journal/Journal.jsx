import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Search, Trash2, Save, X, BookOpen, Heart, Smile, Frown, Meh, Star, 
  Filter, Hash, Download, Upload, Calendar as CalendarIcon,
  Grid, List, Archive, ArchiveRestore, Sparkles, Target
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { localStorageService } from '../../services/localStorage';

const MOODS = [
  { id: 'happy', icon: Smile, color: '#10b981', label: 'Happy', emoji: '😊' },
  { id: 'neutral', icon: Meh, color: '#6b7280', label: 'Neutral', emoji: '😐' },
  { id: 'sad', icon: Frown, color: '#ef4444', label: 'Sad', emoji: '😢' },
  { id: 'excited', icon: Star, color: '#f59e0b', label: 'Excited', emoji: '⭐' },
  { id: 'calm', icon: Heart, color: '#8b5cf6', label: 'Calm', emoji: '💜' },
  { id: 'grateful', icon: Sparkles, color: '#ec4899', label: 'Grateful', emoji: '✨' },
];

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
  const [filterMood, setFilterMood] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy] = useState('date'); // date, mood, length
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
    
    // Filter by mood
    if (filterMood) {
      filtered = filtered.filter(entry => entry.mood === filterMood);
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
        case 'mood': {
          const moodOrder = ['happy', 'excited', 'calm', 'grateful', 'neutral', 'sad'];
          return moodOrder.indexOf(a.mood) - moodOrder.indexOf(b.mood);
        }
        case 'length':
          return b.content.length - a.content.length;
        default: // date
          return new Date(b.date) - new Date(a.date);
      }
    });
    
    return filtered;
  }, [journalEntries, searchQuery, filterMood, filterTag, showArchived, sortBy]);

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
    const moodCounts = MOODS.reduce((acc, mood) => {
      acc[mood.id] = journalEntries.filter(e => e.mood === mood.id).length;
      return acc;
    }, {});
    const mostCommonMood = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0]] > moodCounts[b[0]] ? a : b
    )[0];
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
      mostCommonMood,
      moodCounts,
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
        mood: 'neutral',
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Entries</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
              </div>
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Current Streak</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.streak} days</p>
              </div>
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">This Month</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.thisMonth}</p>
              </div>
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Most Common Mood</p>
                <p className="text-base sm:text-lg font-bold capitalize">{stats.mostCommonMood}</p>
              </div>
              {MOODS.find(m => m.id === stats.mostCommonMood) && (
                <div className="text-xl sm:text-2xl">
                  {MOODS.find(m => m.id === stats.mostCommonMood).emoji}
                </div>
              )}
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

        {/* Mood Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          {MOODS.length > 0 && (
            <>
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Mood:</span>
              <Button
                variant={filterMood === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMood('')}
              >
                All
              </Button>
              {MOODS.map(mood => {
                const Icon = mood.icon;
                return (
                  <Button
                    key={mood.id}
                    variant={filterMood === mood.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterMood(filterMood === mood.id ? '' : mood.id)}
                    className="gap-2"
                    style={filterMood === mood.id ? { borderColor: mood.color } : {}}
                  >
                    <Icon className="h-4 w-4" style={{ color: mood.color }} />
                    {mood.label}
                  </Button>
                );
              })}
            </>
          )}
          {allTags.length > 0 && (
            <>
              <span className="text-sm font-medium text-muted-foreground">Tags:</span>
              <Button
                variant={filterTag === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTag('')}
              >
                All
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={filterTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                  className="gap-1"
                >
                  <Hash className="h-3 w-3" />
                  {tag}
                </Button>
              ))}
            </>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="gap-2"
            >
              {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {showArchived ? 'Show Active' : 'Show Archived'}
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
              {searchQuery || filterMood || filterTag
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
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-4"
        }>
          {filteredJournalEntries.map(entry => {
            const mood = MOODS.find(m => m.id === entry.mood) || MOODS[1];
            const MoodIcon = mood.icon;
            return (
              <Card
                key={entry.id}
                className={`hover-lift cursor-pointer transition-all group ${
                  viewMode === VIEW_MODES.LIST ? 'flex items-start gap-4' : ''
                }`}
                onClick={() => handleEditJournalEntry(entry)}
                style={{ borderLeft: `4px solid ${mood.color}` }}
              >
                <CardHeader className={`pb-3 ${viewMode === VIEW_MODES.LIST ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: `${mood.color}20` }}
                        >
                          <MoodIcon className="h-5 w-5" style={{ color: mood.color }} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {getRelativeDate(entry.date)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(entry.date)}
                          </p>
                        </div>
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
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
                        className="h-8 w-8 text-destructive"
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
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
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
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  type="date"
                  value={selectedJournalEntry.date}
                  onChange={(e) => setSelectedJournalEntry({ ...selectedJournalEntry, date: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Mood</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
                  {MOODS.map(mood => {
                    const Icon = mood.icon;
                    return (
                      <button
                        key={mood.id}
                        onClick={() => setSelectedJournalEntry({ ...selectedJournalEntry, mood: mood.id })}
                        className={`
                          flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                          ${selectedJournalEntry.mood === mood.id
                            ? 'border-foreground scale-105'
                            : 'border-border hover:scale-102'
                          }
                        `}
                        style={selectedJournalEntry.mood === mood.id ? { backgroundColor: `${mood.color}15` } : {}}
                      >
                        <Icon className="h-6 w-6" style={{ color: mood.color }} />
                        <span className="text-xs font-medium">{mood.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Content</label>
                <textarea
                  ref={textareaRef}
                  value={selectedJournalEntry.content}
                  onChange={(e) => setSelectedJournalEntry({ ...selectedJournalEntry, content: e.target.value })}
                  placeholder="How was your day? What are you grateful for? What did you learn? What are your goals for tomorrow?"
                  className="w-full min-h-[300px] sm:min-h-[400px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
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

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsJournalDialogOpen(false);
                    setSelectedJournalEntry(null);
                  }}
                >
                  Cancel
                </Button>
                {selectedJournalEntry.id && (
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteJournalEntry(selectedJournalEntry.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button onClick={handleSaveJournalEntry} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Entry
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
