import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Tag, Pin, PinOff, Trash2, Edit2, Save, X, BookOpen,
  FileText, Calendar, Heart, Smile, Frown, Meh, Star, Filter,
  ChevronLeft, ChevronRight, MoreVertical, Hash
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { localStorageService } from '../../services/localStorage';

const NOTE_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Green', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
];

const MOODS = [
  { id: 'happy', icon: Smile, color: '#10b981', label: 'Happy' },
  { id: 'neutral', icon: Meh, color: '#6b7280', label: 'Neutral' },
  { id: 'sad', icon: Frown, color: '#ef4444', label: 'Sad' },
  { id: 'excited', icon: Star, color: '#f59e0b', label: 'Excited' },
  { id: 'calm', icon: Heart, color: '#8b5cf6', label: 'Calm' },
];

const NotesJournal = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterTag, setFilterTag] = useState('');
  const [filterMood, setFilterMood] = useState('');

  useEffect(() => {
    loadNotes();
    loadJournalEntries();
  }, []);

  const loadNotes = () => {
    const loadedNotes = localStorageService.getNotes();
    setNotes(loadedNotes);
  };

  const loadJournalEntries = () => {
    const loadedEntries = localStorageService.getJournalEntries();
    setJournalEntries(loadedEntries);
  };

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (filterTag) {
      filtered = filtered.filter(note =>
        note.tags.some(tag => tag.toLowerCase() === filterTag.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [notes, searchQuery, filterTag]);

  const filteredJournalEntries = useMemo(() => {
    let filtered = journalEntries;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.content.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (filterMood) {
      filtered = filtered.filter(entry => entry.mood === filterMood);
    }
    
    if (filterTag) {
      filtered = filtered.filter(entry =>
        entry.tags.some(tag => tag.toLowerCase() === filterTag.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [journalEntries, searchQuery, filterMood, filterTag]);

  const allTags = useMemo(() => {
    const noteTags = notes.flatMap(n => n.tags);
    const journalTags = journalEntries.flatMap(e => e.tags);
    return [...new Set([...noteTags, ...journalTags])];
  }, [notes, journalEntries]);

  const handleCreateNote = () => {
    setSelectedNote({
      title: '',
      content: '',
      tags: [],
      color: NOTE_COLORS[0].value,
      pinned: false,
    });
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (!selectedNote) return;
    
    if (selectedNote.id) {
      const updated = localStorageService.updateNote(selectedNote.id, selectedNote);
      if (updated) {
        loadNotes();
        setIsNoteDialogOpen(false);
        setSelectedNote(null);
      }
    } else {
      const newNote = localStorageService.addNote(selectedNote);
      if (newNote) {
        loadNotes();
        setIsNoteDialogOpen(false);
        setSelectedNote(null);
      }
    }
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      localStorageService.deleteNote(noteId);
      loadNotes();
      if (selectedNote?.id === noteId) {
        setIsNoteDialogOpen(false);
        setSelectedNote(null);
      }
    }
  };

  const handleEditNote = (note) => {
    setSelectedNote({ ...note });
    setIsNoteDialogOpen(true);
  };

  const handleTogglePin = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      localStorageService.updateNote(noteId, { pinned: !note.pinned });
      loadNotes();
    }
  };

  const handleAddTag = (tag) => {
    if (!selectedNote) return;
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedNote.tags.includes(trimmedTag)) {
      setSelectedNote({ ...selectedNote, tags: [...selectedNote.tags, trimmedTag] });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!selectedNote) return;
    setSelectedNote({
      ...selectedNote,
      tags: selectedNote.tags.filter(tag => tag !== tagToRemove),
    });
  };

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
      });
    }
    setIsJournalDialogOpen(true);
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Notes & Journal
        </h1>
        <p className="text-muted-foreground text-lg">
          Capture your thoughts, ideas, and daily reflections
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Journal
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            {activeTab === 'notes' ? (
              <Button onClick={handleCreateNote} className="gap-2">
                <Plus className="h-4 w-4" />
                New Note
              </Button>
            ) : (
              <Button onClick={handleCreateJournalEntry} className="gap-2">
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="notes" className="space-y-6">
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter by tag:</span>
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
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No notes found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery || filterTag
                    ? 'Try adjusting your search or filters'
                    : 'Create your first note to get started'}
                </p>
                <Button onClick={handleCreateNote} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => (
                <Card
                  key={note.id}
                  className="hover-lift cursor-pointer transition-all group"
                  onClick={() => handleEditNote(note)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {note.pinned && (
                            <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <CardTitle className="text-lg font-semibold truncate" style={{ color: note.color }}>
                            {note.title || 'Untitled Note'}
                          </CardTitle>
                        </div>
                        {note.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {note.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(note.id);
                          }}
                        >
                          {note.pinned ? (
                            <PinOff className="h-4 w-4" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {note.content || 'No content'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="journal" className="space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            {MOODS.length > 0 && (
              <>
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filter by mood:</span>
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
          </div>

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
            <div className="space-y-4">
              {filteredJournalEntries.map(entry => {
                const mood = MOODS.find(m => m.id === entry.mood) || MOODS[1];
                const MoodIcon = mood.icon;
                return (
                  <Card
                    key={entry.id}
                    className="hover-lift cursor-pointer transition-all group"
                    onClick={() => handleEditJournalEntry(entry)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${mood.color}20` }}
                            >
                              <MoodIcon className="h-5 w-5" style={{ color: mood.color }} />
                            </div>
                            <div>
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
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJournalEntry(entry.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                        {entry.content || 'No content'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Title</label>
                <Input
                  value={selectedNote.title}
                  onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                  placeholder="Note title..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Content</label>
                <textarea
                  value={selectedNote.content}
                  onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                  placeholder="Write your note here..."
                  className="w-full min-h-[300px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Color</label>
                <div className="grid grid-cols-8 gap-2">
                  {NOTE_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedNote({ ...selectedNote, color: color.value })}
                      className={`
                        w-full aspect-square rounded-lg border-2 transition-all
                        ${selectedNote.color === color.value ? 'scale-110 border-foreground' : 'border-transparent hover:scale-105'}
                      `}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Tags</label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {selectedNote.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
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
                      handleAddTag(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={selectedNote.pinned ? 'default' : 'outline'}
                  onClick={() => setSelectedNote({ ...selectedNote, pinned: !selectedNote.pinned })}
                  className="gap-2"
                >
                  {selectedNote.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  {selectedNote.pinned ? 'Unpin' : 'Pin'}
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNoteDialogOpen(false);
                    setSelectedNote(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveNote} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Note
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Journal Entry Dialog */}
      <Dialog open={isJournalDialogOpen} onOpenChange={setIsJournalDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Journal Entry</DialogTitle>
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
                <div className="grid grid-cols-5 gap-2">
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
                  value={selectedJournalEntry.content}
                  onChange={(e) => setSelectedJournalEntry({ ...selectedJournalEntry, content: e.target.value })}
                  placeholder="How was your day? What are you grateful for? What did you learn?"
                  className="w-full min-h-[300px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
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

export default NotesJournal;

