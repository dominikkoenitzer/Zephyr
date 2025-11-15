import { localStorageService } from './localStorage';

class SearchService {
  /**
   * Unified search across all data types
   * @param {string} query - Search query
   * @returns {Object} Grouped search results
   */
  searchAll(query) {
    if (!query || query.trim().length === 0) {
      return { notes: [], journal: [], events: [], tasks: [] };
    }

    const searchTerm = query.toLowerCase().trim();
    const results = {
      notes: [],
      journal: [],
      events: [],
      tasks: []
    };

    // Search Notes
    const notes = localStorageService.getNotes();
    notes.forEach(note => {
      const matchesTitle = note.title?.toLowerCase().includes(searchTerm);
      const matchesContent = note.content?.toLowerCase().includes(searchTerm);
      const matchesTags = note.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (matchesTitle || matchesContent || matchesTags) {
        results.notes.push({
          ...note,
          matchType: matchesTitle ? 'title' : matchesContent ? 'content' : 'tag',
          matchText: this.highlightMatch(note.title || note.content || '', searchTerm)
        });
      }
    });

    // Search Journal Entries
    const journalEntries = localStorageService.getJournalEntries();
    journalEntries.forEach(entry => {
      const matchesContent = entry.content?.toLowerCase().includes(searchTerm);
      const matchesTags = entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      const matchesDate = entry.date?.toLowerCase().includes(searchTerm);
      
      if (matchesContent || matchesTags || matchesDate) {
        results.journal.push({
          ...entry,
          matchType: matchesDate ? 'date' : matchesContent ? 'content' : 'tag',
          matchText: this.highlightMatch(entry.content || entry.date || '', searchTerm)
        });
      }
    });

    // Search Calendar Events
    const events = localStorageService.getCalendarEvents();
    events.forEach(event => {
      const matchesTitle = event.title?.toLowerCase().includes(searchTerm);
      const matchesDescription = event.description?.toLowerCase().includes(searchTerm);
      const matchesLocation = event.location?.toLowerCase().includes(searchTerm);
      const matchesCategory = event.category?.toLowerCase().includes(searchTerm);
      
      if (matchesTitle || matchesDescription || matchesLocation || matchesCategory) {
        results.events.push({
          ...event,
          matchType: matchesTitle ? 'title' : matchesDescription ? 'description' : matchesLocation ? 'location' : 'category',
          matchText: this.highlightMatch(event.title || event.description || '', searchTerm)
        });
      }
    });

    // Search Tasks
    const tasks = localStorageService.getTasks();
    tasks.forEach(task => {
      const matchesTitle = task.title?.toLowerCase().includes(searchTerm);
      const matchesDescription = task.description?.toLowerCase().includes(searchTerm);
      
      if (matchesTitle || matchesDescription) {
        results.tasks.push({
          ...task,
          matchType: matchesTitle ? 'title' : 'description',
          matchText: this.highlightMatch(task.title || task.description || '', searchTerm)
        });
      }
    });

    // Sort results by relevance (title matches first, then content)
    results.notes.sort((a, b) => {
      if (a.matchType === 'title' && b.matchType !== 'title') return -1;
      if (a.matchType !== 'title' && b.matchType === 'title') return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    results.journal.sort((a, b) => {
      if (a.matchType === 'date' && b.matchType !== 'date') return -1;
      if (a.matchType !== 'date' && b.matchType === 'date') return 1;
      return new Date(b.date) - new Date(a.date);
    });

    results.events.sort((a, b) => {
      if (a.matchType === 'title' && b.matchType !== 'title') return -1;
      if (a.matchType !== 'title' && b.matchType === 'title') return 1;
      return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
    });

    results.tasks.sort((a, b) => {
      if (a.matchType === 'title' && b.matchType !== 'title') return -1;
      if (a.matchType !== 'title' && b.matchType === 'title') return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    return results;
  }

  /**
   * Highlight matching text in search results
   * @param {string} text - Text to highlight
   * @param {string} searchTerm - Search term
   * @returns {string} Text with highlighted matches
   */
  highlightMatch(text, searchTerm) {
    if (!text || !searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Get total result count
   * @param {Object} results - Search results object
   * @returns {number} Total count
   */
  getTotalCount(results) {
    return (results.notes?.length || 0) + 
           (results.journal?.length || 0) + 
           (results.events?.length || 0) + 
           (results.tasks?.length || 0);
  }
}

export const searchService = new SearchService();
export default searchService;

