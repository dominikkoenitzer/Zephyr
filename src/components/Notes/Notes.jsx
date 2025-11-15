import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Pin, PinOff, Trash2, Edit2, Save, X, FileText, Filter, Hash
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
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

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const loadedNotes = localStorageService.getNotes();
    setNotes(loadedNotes);
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

  const allTags = useMemo(() => {
    return [...new Set(notes.flatMap(n => n.tags))];
  }, [notes]);

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

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Notes
        </h1>
        <p className="text-muted-foreground text-lg">
          Capture your thoughts and ideas
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreateNote} className="gap-2">
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

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
    </div>
  );
};

export default Notes;

