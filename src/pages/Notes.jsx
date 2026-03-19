import Notes from '../components/Notes/Notes';
import Journal from '../components/Journal/Journal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

function NotesPage() {
  return (
    <div className="w-full flex-1 flex flex-col border border-border/60 rounded-2xl p-responsive bg-card/80 overflow-y-auto scrollbar-thin gap-[var(--panel-gap)]">
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-0">
          <Notes />
        </TabsContent>

        <TabsContent value="journal" className="mt-0">
          <Journal />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NotesPage;
