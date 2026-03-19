import Notes from '../components/Notes/Notes';
import Journal from '../components/Journal/Journal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clock3, FileText, Flame, Layers3, Stars } from 'lucide-react';
import { localStorageService } from '../services/localStorage';
import PageHeader from '../components/Layout/PageHeader';

function NotesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const requestedTab = searchParams.get('view');
  const activeTab = requestedTab === 'journal' ? 'journal' : 'notes';

  useEffect(() => {
    const loadWorkspaceData = () => {
      setNotes(localStorageService.getNotes());
      setJournalEntries(localStorageService.getJournalEntries());
    };

    loadWorkspaceData();
    window.addEventListener('focus', loadWorkspaceData);
    window.addEventListener('storage', loadWorkspaceData);

    return () => {
      window.removeEventListener('focus', loadWorkspaceData);
      window.removeEventListener('storage', loadWorkspaceData);
    };
  }, []);

  const workspaceStats = useMemo(() => {
    const pinnedNotes = notes.filter((note) => note.pinned).length;
    const thisWeekEntries = journalEntries.filter((entry) => {
      const date = new Date(entry.date);
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    }).length;

    const streak = (() => {
      if (journalEntries.length === 0) return 0;
      const sorted = [...journalEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let value = 0;
      for (let i = 0; i < sorted.length; i++) {
        const d = new Date(sorted[i].date);
        d.setHours(0, 0, 0, 0);
        const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
        if (diff === i) value += 1;
        else break;
      }
      return value;
    })();

    return {
      notesCount: notes.length,
      pinnedNotes,
      journalCount: journalEntries.length,
      thisWeekEntries,
      streak,
    };
  }, [notes, journalEntries]);

  const recentActivity = useMemo(() => {
    const noteItems = notes.map((note) => ({
      id: `note-${note.id}`,
      type: 'note',
      title: note.title || 'Untitled Note',
      updatedAt: note.updatedAt || note.createdAt,
      subtitle: note.content?.slice(0, 80) || 'No preview text yet',
    }));

    const journalItems = journalEntries.map((entry) => ({
      id: `journal-${entry.id}`,
      type: 'journal',
      title: entry.date ? new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Journal Entry',
      updatedAt: entry.updatedAt || entry.createdAt || entry.date,
      subtitle: entry.content?.slice(0, 80) || 'No reflection text yet',
    }));

    return [...noteItems, ...journalItems]
      .filter((item) => item.updatedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 6);
  }, [notes, journalEntries]);

  const handleTabChange = (nextTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', nextTab);
      return next;
    });
  };

  return (
    <div className="relative w-full flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card/65">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-14 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative h-full overflow-y-auto scrollbar-thin">
        <div className="p-responsive space-y-4 sm:space-y-5 md:space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/55 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
              <div className="w-full">
                <PageHeader
                  title="Notes & Journal"
                  description="One focused environment for capturing ideas, structuring knowledge, and building a daily reflection habit."
                />
                <p className="text-xs text-muted-foreground md:hidden">
                  {workspaceStats.notesCount} notes • {workspaceStats.journalCount} entries • {workspaceStats.streak} day streak
                </p>
              </div>

              <div className="hidden md:grid grid-cols-3 gap-2 sm:gap-3 w-full xl:w-auto xl:min-w-[420px]">
                <div className="rounded-xl border border-border/50 bg-card/60 p-3">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-xl sm:text-2xl font-semibold text-foreground mt-1">{workspaceStats.notesCount}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/60 p-3">
                  <p className="text-xs text-muted-foreground">Entries</p>
                  <p className="text-xl sm:text-2xl font-semibold text-foreground mt-1">{workspaceStats.journalCount}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/60 p-3">
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="text-xl sm:text-2xl font-semibold text-foreground mt-1">{workspaceStats.streak}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:hidden grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border/50 bg-card/60 p-2.5">
              <p className="text-[11px] text-muted-foreground">Pinned</p>
              <p className="text-base font-semibold text-foreground mt-0.5">{workspaceStats.pinnedNotes}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/60 p-2.5">
              <p className="text-[11px] text-muted-foreground">This Week</p>
              <p className="text-base font-semibold text-foreground mt-0.5">{workspaceStats.thisWeekEntries}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/60 p-2.5">
              <p className="text-[11px] text-muted-foreground">Streak</p>
              <p className="text-base font-semibold text-foreground mt-0.5">{workspaceStats.streak}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4 sm:gap-5 md:gap-6 items-start">
            <aside className="hidden xl:block xl:sticky xl:top-4 space-y-3 sm:space-y-4">
              <div className="rounded-2xl border border-border/50 bg-card/55 p-4 sm:p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-primary" />
                  Workspace Focus
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Switch your writing mode and stay in flow.</p>

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('notes')}
                    className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${activeTab === 'notes' ? 'border-primary/35 bg-accent/45' : 'border-border/50 bg-card/50 hover:bg-accent/35'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Notes</p>
                        <p className="text-xs text-muted-foreground">Capture, sort, and retrieve fast</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('journal')}
                    className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${activeTab === 'journal' ? 'border-primary/35 bg-accent/45' : 'border-border/50 bg-card/50 hover:bg-accent/35'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Journal</p>
                        <p className="text-xs text-muted-foreground">Reflect and build consistency</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card/55 p-4 sm:p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Stars className="h-4 w-4 text-primary" />
                  Live Metrics
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border/40 bg-card/60 p-2.5">
                    <p className="text-[11px] text-muted-foreground">Pinned Notes</p>
                    <p className="text-lg font-semibold text-foreground mt-0.5">{workspaceStats.pinnedNotes}</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-card/60 p-2.5">
                    <p className="text-[11px] text-muted-foreground">This Week</p>
                    <p className="text-lg font-semibold text-foreground mt-0.5">{workspaceStats.thisWeekEntries}</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-card/60 p-2.5 col-span-2">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-primary" />
                      Reflection Streak
                    </p>
                    <p className="text-lg font-semibold text-foreground mt-0.5">{workspaceStats.streak} days</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card/55 p-4 sm:p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  Recent Activity
                </h3>
                <div className="mt-3 space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {recentActivity.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
                      Your recent notes and journal updates will show up here.
                    </div>
                  )}
                  {recentActivity.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabChange(item.type === 'note' ? 'notes' : 'journal')}
                      className="w-full text-left rounded-xl border border-border/40 bg-card/60 p-2.5 hover:bg-accent/35 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${item.type === 'note' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                          {item.type === 'note' ? <FileText className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                        </span>
                        <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="rounded-2xl border border-border/50 bg-card/55 p-2 sm:p-3 shadow-sm">
                <TabsList className="w-full h-auto grid grid-cols-2 rounded-xl border border-border/40 bg-muted/35 p-1.5">
                  <TabsTrigger value="notes" className="h-auto rounded-lg px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <span className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold">
                      <FileText className="h-4 w-4" />
                      Notes
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="journal" className="h-auto rounded-lg px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <span className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold">
                      <BookOpen className="h-4 w-4" />
                      Journal
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="notes" className="mt-3 sm:mt-4">
                <div className="animate-fade-in-up rounded-2xl border border-border/45 bg-card/45 p-1.5 sm:p-2">
                  <Notes />
                </div>
              </TabsContent>

              <TabsContent value="journal" className="mt-3 sm:mt-4">
                <div className="animate-fade-in-up rounded-2xl border border-border/45 bg-card/45 p-1.5 sm:p-2">
                  <Journal />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotesPage;
