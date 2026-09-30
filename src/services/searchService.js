import { localStorageService } from './localStorage';

class SearchService {
  /**
   * Search every task by title, description and #tag.
   *
   * Still returns a grouped object instead of a bare array: Notes used to be
   * the second group, and the command palette renders whatever groups it is
   * handed, so a third one can be added back without touching the caller.
   *
   * @param {string} query - Search query
   * @returns {{ tasks: Array }} Grouped search results
   */
  searchAll(query) {
    if (!query || query.trim().length === 0) {
      return { tasks: [] };
    }

    const searchTerm = query.toLowerCase().trim();
    const results = {
      tasks: []
    };

    // Search Tasks
    const tasks = localStorageService.getTasks();
    tasks.forEach(task => {
      const matchesTitle = task.title?.toLowerCase().includes(searchTerm);
      const matchesDescription = task.description?.toLowerCase().includes(searchTerm);
      const matchesTags = task.tags?.some(tag => tag.toLowerCase().includes(searchTerm));

      if (matchesTitle || matchesDescription || matchesTags) {
        results.tasks.push({
          ...task,
          matchType: matchesTitle ? 'title' : matchesDescription ? 'description' : 'tag',
        });
      }
    });

    // Sort results by relevance (title matches first, then the rest)
    results.tasks.sort((a, b) => {
      if (a.matchType === 'title' && b.matchType !== 'title') return -1;
      if (a.matchType !== 'title' && b.matchType === 'title') return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    return results;
  }

  /**
   * Get total result count
   * @param {Object} results - Search results object
   * @returns {number} Total count
   */
  getTotalCount(results) {
    return results.tasks?.length || 0;
  }
}

export const searchService = new SearchService();
export default searchService;

