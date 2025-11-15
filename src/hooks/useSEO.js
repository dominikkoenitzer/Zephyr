import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageMetadata = {
  '/': {
    title: 'Dashboard | Zephyr - Flow Through Focus',
    description: 'View your productivity dashboard with focus time, tasks, and progress tracking.',
    keywords: 'productivity dashboard, focus tracking, task management, productivity metrics',
  },
  '/tasks': {
    title: 'Tasks | Zephyr - Task Management & Organization',
    description: 'Manage and organize your tasks with folders, priorities, and due dates. Stay productive with Zephyr task management.',
    keywords: 'task management, to-do list, task organizer, productivity tasks, task tracking',
  },
  '/focus': {
    title: 'Focus Timer | Zephyr - Pomodoro & Focus Sessions',
    description: 'Boost your focus with Zephyr Pomodoro timer. Customizable focus sessions, breaks, and productivity tracking.',
    keywords: 'pomodoro timer, focus timer, productivity timer, time management, focus sessions',
  },
  '/calendar': {
    title: 'Calendar | Zephyr - Event Planning & Scheduling',
    description: 'Plan and manage your events, meetings, and appointments with Zephyr calendar. Stay organized and never miss important dates.',
    keywords: 'calendar app, event planning, schedule management, appointment calendar, productivity calendar',
  },
  '/notes': {
    title: 'Notes | Zephyr - Note Taking & Organization',
    description: 'Take, organize, and search your notes with Zephyr. Color-coded notes, folders, tags, and powerful search.',
    keywords: 'note taking, notes app, note organizer, digital notes, productivity notes',
  },
  '/journal': {
    title: 'Journal | Zephyr - Daily Journaling & Reflection',
    description: 'Reflect and journal your thoughts with Zephyr. Daily journaling, mood tracking, and personal growth.',
    keywords: 'journal app, daily journal, journaling, reflection, mood tracking, personal journal',
  },
  '/settings': {
    title: 'Settings | Zephyr - Customize Your Experience',
    description: 'Customize Zephyr settings, preferences, and data management. Personalize your productivity experience.',
    keywords: 'app settings, preferences, customization, productivity settings',
  },
  '/help': {
    title: 'Help & Support | Zephyr - FAQs & Documentation',
    description: 'Get help with Zephyr. Find answers to frequently asked questions, privacy policy, and terms of service.',
    keywords: 'help, support, FAQ, documentation, user guide, productivity app help',
  },
};

export const useSEO = () => {
  const location = useLocation();

  useEffect(() => {
    const metadata = pageMetadata[location.pathname] || pageMetadata['/'];
    
    // Update document title
    document.title = metadata.title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', metadata.description);
    
    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', metadata.keywords);
    
    // Update Open Graph tags
    const updateOGTag = (property, content) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', content);
    };
    
    updateOGTag('og:title', metadata.title);
    updateOGTag('og:description', metadata.description);
    updateOGTag('og:url', `https://zephyr.app${location.pathname}`);
    
    // Update Twitter Card tags
    const updateTwitterTag = (name, content) => {
      let twitterTag = document.querySelector(`meta[name="${name}"]`);
      if (!twitterTag) {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('name', name);
        document.head.appendChild(twitterTag);
      }
      twitterTag.setAttribute('content', content);
    };
    
    updateTwitterTag('twitter:title', metadata.title);
    updateTwitterTag('twitter:description', metadata.description);
    
    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', `https://zephyr.app${location.pathname}`);
    
  }, [location.pathname]);
};

