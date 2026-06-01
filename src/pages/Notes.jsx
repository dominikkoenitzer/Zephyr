import Notes from '../components/Notes/Notes';
import PageHeader from '../components/Layout/PageHeader';
import PageContainer from '../components/Layout/PageContainer';

function NotesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Notes"
        description="Capture your ideas and keep them in one place."
      />

      <Notes />
    </PageContainer>
  );
}

export default NotesPage;
