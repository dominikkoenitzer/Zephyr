import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import { Plus, Search, Pin, PinOff, Trash2, Save, X, FileText, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { EmptyState } from '../ui/empty-state';
import { localStorageService } from '../../services/localStorage';
import { useNotes } from '../../hooks/useStore';
import { toast } from 'sonner';

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

const chipClass = (active) =>
  `text-xs px-3 py-1 rounded-full border transition-colors ${
    active ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent/50'
  }`;

// Turn free-typed capture text into a note: first line becomes the title,
// the rest is content, and #tags anywhere are extracted (same convention
// as the tasks quick add).
const parseCapture = (raw) => {
  const tags = [];
  const cleaned = raw
    .replace(/(^|\s)#([\p{L}\d_-]+)/gu, (match, lead, tag) => {
      const t = tag.toLowerCase();
      if (!tags.includes(t)) tags.push(t);
      return lead;
    })
    .replace(/[ \t]{2,}/g, ' ');
  const lines = cleaned.split('\n');
  const firstIdx = lines.findIndex((l) => l.trim());
  if (firstIdx === -1) return { title: '', content: '', tags };
  const title = lines[firstIdx].trim().slice(0, 120);
  const content = lines.slice(firstIdx + 1).join('\n').trim();
  return { title, content, tags };
};

const cardMotion = {
  layout: true,
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
  transition: { type: 'spring', stiffness: 500, damping: 40 },
};

const Notes = () => {
  const [notes] = useNotes();
  const [query, setQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [editing, setEditing] = useState(null);
  const [tagDraft, setTagDraft] = useState('');
  const [draft, setDraft] = useState('');
  const [draftColor, setDraftColor] = useState(NOTE_COLORS[0].value);
  const captureRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep link from search results: /notes?open=<id> opens that note's editor.
  // Adjusted during render rather than from an effect so the editor is already
  // open on the first paint; openHandled tracks which id this render answered,
  // and falls back to null when the param is stripped so the same note can be
  // opened again later.
  const openId = searchParams.get('open');
  const [openHandled, setOpenHandled] = useState(null);
  if (openId !== openHandled) {
    setOpenHandled(openId);
    const note = openId ? notes.find((n) => n.id === openId) : null;
    if (note) setEditing({ ...note, tags: note.tags || [] });
  }

  useEffect(() => {
    if (openId) setSearchParams({}, { replace: true });
  }, [openId, setSearchParams]);

  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags || []))], [notes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...notes]
      .filter((n) => {
        if (filterTag && !(n.tags || []).some((t) => t.toLowerCase() === filterTag.toLowerCase())) return false;
        if (!q) return true;
        return (
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q) ||
          (n.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      });
  }, [notes, query, filterTag]);

  const pinnedNotes = visible.filter((n) => n.pinned);
  const otherNotes = visible.filter((n) => !n.pinned);

  const draftParsed = useMemo(() => parseCapture(draft), [draft]);

  const saveCapture = () => {
    if (!draftParsed.title && !draftParsed.content) return;
    localStorageService.addNote({
      title: draftParsed.title || 'Untitled note',
      content: draftParsed.content,
      tags: draftParsed.tags,
      color: draftColor,
      pinned: false,
    });
    setDraft('');
    captureRef.current?.focus();
  };

  const openEdit = (note) => setEditing({ ...note, tags: note.tags || [] });

  const save = () => {
    if (!editing) return;
    const payload = {
      title: editing.title.trim() || 'Untitled note',
      content: editing.content,
      tags: editing.tags,
      color: editing.color,
      pinned: editing.pinned,
    };
    if (editing.id) localStorageService.updateNote(editing.id, payload);
    else localStorageService.addNote(payload);
    setEditing(null);
  };

  const remove = (id, e) => {
    e?.stopPropagation();
    const removed = notes.find((n) => n.id === id);
    localStorageService.deleteNote(id);
    if (editing?.id === id) setEditing(null);
    if (removed) {
      toast('Note deleted', {
        action: {
          label: 'Undo',
          onClick: () => localStorageService.saveNotes([...localStorageService.getNotes(), removed]),
        },
      });
    }
  };

  const togglePin = (note, e) => {
    e?.stopPropagation();
    localStorageService.updateNote(note.id, { pinned: !note.pinned });
  };

  const addTag = (raw) => {
    const t = raw.trim().replace(/^#/, '');
    if (!t || !editing) return;
    if (!editing.tags.includes(t)) setEditing({ ...editing, tags: [...editing.tags, t] });
    setTagDraft('');
  };

  const removeTag = (t) => setEditing({ ...editing, tags: editing.tags.filter((x) => x !== t) });

  const renderNote = (note) => (
    <m.div key={note.id} {...cardMotion}>
      <Card
        onClick={() => openEdit(note)}
        className="group h-full cursor-pointer hover-lift"
        style={{ borderLeft: `4px solid ${note.color}` }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {note.pinned && <Pin className="h-4 w-4 text-primary shrink-0" />}
              <CardTitle className="text-base font-semibold truncate">{note.title || 'Untitled note'}</CardTitle>
            </div>
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                onClick={(e) => togglePin(note, e)}
              >
                {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                aria-label="Delete note"
                onClick={(e) => remove(note.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3 whitespace-pre-wrap">
            {note.content || 'No content'}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap min-w-0">
              {(note.tags || []).slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </m.div>
  );

  const renderGrid = (list) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence initial={false}>{list.map(renderNote)}</AnimatePresence>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* Quick capture — type a thought, hit Ctrl+Enter, done */}
      <div className="rounded-xl border border-border bg-card focus-within:border-primary/40 transition-colors">
        <textarea
          ref={captureRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              saveCapture();
            }
            if (e.key === 'Escape') setDraft('');
          }}
          rows={draft ? 4 : 2}
          placeholder="Jot something down… first line becomes the title, #tags work"
          aria-label="Quick capture a note"
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {draft.trim() && (
          <div className="flex items-center justify-between gap-3 flex-wrap px-3.5 pb-3 animate-fade-in">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {draftParsed.tags.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {draftParsed.tags.map((t) => `#${t}`).join(' ')}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setDraftColor(c.value)}
                    aria-label={c.name}
                    title={c.name}
                    className={`h-4 w-4 rounded-full border transition-transform ${
                      draftColor === c.value ? 'scale-125 border-foreground' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] text-muted-foreground">Ctrl+Enter</span>
              <Button size="sm" onClick={saveCapture}>
                <Plus className="h-4 w-4 mr-1" />
                Save note
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Search + tag filter */}
      {(notes.length > 0 || query) && (
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="notes-search"
              name="notes-search"
              placeholder="Search notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10 rounded-full bg-card/60"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button type="button" onClick={() => setFilterTag('')} className={chipClass(filterTag === '')}>
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                  className={chipClass(filterTag === tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {visible.length === 0 ? (
        <Card className="border-0 bg-transparent">
          <CardContent className="p-0">
            <EmptyState
              icon={FileText}
              title={query || filterTag ? 'No matching notes' : 'No notes yet'}
              description={
                query || filterTag
                  ? 'Try a different search or tag.'
                  : 'Type in the box above and press Ctrl+Enter — that’s the whole flow.'
              }
            />
          </CardContent>
        </Card>
      ) : pinnedNotes.length > 0 ? (
        <div className="space-y-5">
          <section>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Pinned · {pinnedNotes.length}
            </h2>
            {renderGrid(pinnedNotes)}
          </section>
          {otherNotes.length > 0 && (
            <section>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Others · {otherNotes.length}
              </h2>
              {renderGrid(otherNotes)}
            </section>
          )}
        </div>
      ) : (
        renderGrid(otherNotes)
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit note' : 'New note'}</DialogTitle>
            <DialogDescription>Add a title, write your note, and optionally tag it. Ctrl+Enter saves.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-1">
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Title"
                  className="text-lg font-semibold"
                />
                <Button
                  variant={editing.pinned ? 'default' : 'outline'}
                  size="icon"
                  aria-label={editing.pinned ? 'Unpin' : 'Pin'}
                  onClick={() => setEditing({ ...editing, pinned: !editing.pinned })}
                >
                  {editing.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
              </div>

              <textarea
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    save();
                  }
                }}
                placeholder="Write your note here..."
                className="w-full min-h-[240px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setEditing({ ...editing, color: c.value })}
                      aria-label={c.name}
                      title={c.name}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        editing.color === c.value ? 'scale-110 border-foreground' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Tags</label>
                {editing.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {editing.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`} className="hover:text-primary/70">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  placeholder="Add a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagDraft);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                <div>
                  {editing.id && (
                    <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={(e) => remove(editing.id, e)}>
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button onClick={save}>
                    <Save className="h-4 w-4 mr-1.5" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
