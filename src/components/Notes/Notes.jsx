import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Search, Pin, PinOff, Trash2, Edit2, Save, X, FileText, Filter, Hash,
  Folder, FolderPlus, Download, Upload, MoreVertical, Star, StarOff, 
  Calendar, Clock, Tag, Grid, List, Archive, ArchiveRestore
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
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

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState('updated'); // updated, created, title, color
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    loadNotes();
    loadFolders();
  }, []);

  const loadNotes = () => {
    const loadedNotes = localStorageService.getNotes();
    setNotes(loadedNotes);
  };

  const loadFolders = () => {
    const stored = localStorage.getItem('zephyr_note_folders');
    if (stored) {
      try {
        setFolders(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load folders:', e);
      }
    }
  };

  const saveFolders = (foldersToSave) => {
    localStorage.setItem('zephyr_note_folders', JSON.stringify(foldersToSave));
    setFolders(foldersToSave);
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)].value,
      createdAt: new Date().toISOString(),
    };
    saveFolders([...folders, newFolder]);
    setNewFolderName('');
    setShowFolderDialog(false);
  };

  const deleteFolder = (folderId) => {
    const updatedFolders = folders.filter(f => f.id !== folderId);
    saveFolders(updatedFolders);
    // Move notes from deleted folder to root
    const notesToUpdate = notes.filter(n => n.folderId === folderId);
    notesToUpdate.forEach(note => {
      localStorageService.updateNote(note.id, { folderId: null });
    });
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
    loadNotes();
  };

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    
    // Filter by archived status
    filtered = filtered.filter(note => showArchived ? note.archived : !note.archived);
    
    // Filter by folder
    if (selectedFolder) {
      filtered = filtered.filter(note => note.folderId === selectedFolder);
    } else {
      filtered = filtered.filter(note => !note.folderId);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by tag
    if (filterTag) {
      filtered = filtered.filter(note =>
        note.tags.some(tag => tag.toLowerCase() === filterTag.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'color':
          return a.color.localeCompare(b.color);
        default: // updated
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });
    
    return filtered;
  }, [notes, searchQuery, filterTag, selectedFolder, showArchived, sortBy]);

  const allTags = useMemo(() => {
    return [...new Set(notes.flatMap(n => n.tags))];
  }, [notes]);

  const stats = useMemo(() => {
    return {
      total: notes.length,
      pinned: notes.filter(n => n.pinned).length,
      archived: notes.filter(n => n.archived).length,
      byFolder: folders.map(folder => ({
        ...folder,
        count: notes.filter(n => n.folderId === folder.id).length,
      })),
    };
  }, [notes, folders]);

  const handleCreateNote = () => {
    setSelectedNote({
      title: '',
      content: '',
      tags: [],
      color: NOTE_COLORS[0].value,
      pinned: false,
      folderId: selectedFolder,
      archived: false,
      favorite: false,
    });
    setIsNoteDialogOpen(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
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
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleTogglePin = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      localStorageService.updateNote(noteId, { pinned: !note.pinned });
      loadNotes();
    }
  };

  const handleToggleArchive = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      localStorageService.updateNote(noteId, { archived: !note.archived });
      loadNotes();
    }
  };

  const handleToggleFavorite = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      localStorageService.updateNote(noteId, { favorite: !note.favorite });
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

  const exportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importNotes = () => {
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
              const existing = localStorageService.getNotes();
              const merged = [...existing, ...imported];
              localStorage.setItem('zephyr_notes', JSON.stringify(merged));
              loadNotes();
              alert(`Imported ${imported.length} notes successfully!`);
            }
          } catch (error) {
            alert('Failed to import notes. Invalid file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Notes</h1>
          <p className="text-muted-foreground">
            {stats.total} notes • {stats.pinned} pinned • {stats.archived} archived
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={importNotes} className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={exportNotes} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateNote} className="gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === VIEW_MODES.GRID ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode(VIEW_MODES.GRID)}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === VIEW_MODES.LIST ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode(VIEW_MODES.LIST)}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Folders */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedFolder === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFolder(null)}
          >
            All Notes
          </Button>
          {folders.map(folder => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder(folder.id)}
              className="gap-2"
              style={selectedFolder === folder.id ? { borderColor: folder.color } : {}}
            >
              <Folder className="h-4 w-4" style={{ color: folder.color }} />
              {folder.name} ({stats.byFolder.find(f => f.id === folder.id)?.count || 0})
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFolderDialog(true)}
            className="gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        </div>

        {/* Tags and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          {allTags.length > 0 && (
            <>
              <Filter className="h-4 w-4 text-muted-foreground" />
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

      {/* Notes Grid/List */}
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
        <div className={viewMode === VIEW_MODES.GRID 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-3"
        }>
          {filteredNotes.map(note => (
            <Card
              key={note.id}
              className={`hover-lift cursor-pointer transition-all group relative ${
                viewMode === VIEW_MODES.LIST ? 'flex items-center gap-4' : ''
              }`}
              onClick={() => handleEditNote(note)}
              style={{ borderLeft: `4px solid ${note.color}` }}
            >
              <CardHeader className={`pb-3 ${viewMode === VIEW_MODES.LIST ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {note.pinned && (
                        <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      {note.favorite && (
                        <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 fill-yellow-500" />
                      )}
                      <CardTitle className={`text-lg font-semibold truncate ${viewMode === VIEW_MODES.LIST ? 'text-base' : ''}`}>
                        {note.title || 'Untitled Note'}
                      </CardTitle>
                    </div>
                    {note.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-2">
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
                    {viewMode === VIEW_MODES.LIST && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {note.content || 'No content'}
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
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(note.id);
                      }}
                    >
                      {note.favorite ? (
                        <StarOff className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Star className="h-4 w-4" />
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
              {viewMode === VIEW_MODES.GRID && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {note.content || 'No content'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    {note.folderId && (
                      <span className="flex items-center gap-1">
                        <Folder className="h-3 w-3" />
                        {folders.find(f => f.id === note.folderId)?.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Create or edit your note. Add a title, content, tags, and organize with folders.
            </DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Input
                  value={selectedNote.title}
                  onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                  placeholder="Note title..."
                  className="text-xl font-semibold"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedNote.pinned ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedNote({ ...selectedNote, pinned: !selectedNote.pinned })}
                  >
                    {selectedNote.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={selectedNote.favorite ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedNote({ ...selectedNote, favorite: !selectedNote.favorite })}
                  >
                    {selectedNote.favorite ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <textarea
                  ref={textareaRef}
                  value={selectedNote.content}
                  onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                  placeholder="Write your note here..."
                  className="w-full min-h-[400px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-sm font-medium mb-2 block text-foreground">Folder</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedNote.folderId === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedNote({ ...selectedNote, folderId: null })}
                    >
                      None
                    </Button>
                    {folders.map(folder => (
                      <Button
                        key={folder.id}
                        variant={selectedNote.folderId === folder.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedNote({ ...selectedNote, folderId: folder.id })}
                        className="gap-2"
                      >
                        <Folder className="h-4 w-4" style={{ color: folder.color }} />
                        {folder.name}
                      </Button>
                    ))}
                  </div>
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

      {/* Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your notes by creating folders with custom names.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  createFolder();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createFolder}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
