import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://zephyr.punds.ch';

const pageMetadata = {
  '/': {
    title: 'Zephyr — Free To-Do List & Pomodoro Timer. No Login.',
    description: 'Zephyr is a free, local-first productivity app: a to-do list with natural-language quick add and a Pomodoro focus timer. No login, no signup — your data stays in your browser and it works offline.',
    keywords: 'free productivity app, no login to do list, pomodoro timer, local-first app, offline productivity',
  },
  '/home': {
    title: 'Home | Zephyr — Your Day at a Glance',
    description: 'See active tasks, what is due today, weekly focus minutes and completed sessions in one simple local-first dashboard. No account required.',
    keywords: 'productivity dashboard, local-first app, no signup app, daily overview, personal productivity home',
  },
  '/tasks': {
    title: 'Tasks | Zephyr — To-Do List with Natural-Language Quick Add',
    description: 'Manage tasks with priorities, #tags, and due dates. Type "Email Sam tomorrow !high #work" and Zephyr fills in the rest — no login required.',
    keywords: 'task management, to-do list, natural language task input, task organizer, free task app',
  },
  '/focus': {
    title: 'Focus Timer | Zephyr — Pomodoro & Deep Work Sessions',
    description: 'A customizable Pomodoro timer with presets for deep work and meditation, automatic session tracking, and a daily streak. Free and offline-capable.',
    keywords: 'pomodoro timer, focus timer, deep work timer, productivity timer, time management',
  },
  '/settings': {
    title: 'Settings | Zephyr — Notifications & Data Management',
    description: 'Control notifications and manage your locally stored data. Zephyr keeps everything on your device.',
    keywords: 'app settings, notification preferences, data management, productivity settings',
  },
  '/help': {
    title: 'Help & FAQ | Zephyr — Guides, Privacy Policy & Terms',
    description: 'Quick start guide, frequently asked questions, privacy policy, and terms of service for Zephyr, the free local-first productivity app.',
    keywords: 'help, support, FAQ, documentation, privacy policy, productivity app help',
  },
};

export const useSEO = () => {
  const location = useLocation();

  useEffect(() => {
    const metadata = pageMetadata[location.pathname] || pageMetadata['/'];
    // /home renders the same screen as /, so canonicalize it to the root and
    // search engines don't index duplicate content.
    const canonicalPath = location.pathname === '/home' ? '/' : location.pathname;
    
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
    
    const siteImage = `${SITE_URL}/og-image.png`;
    updateOGTag('og:type', 'website');
    updateOGTag('og:title', metadata.title);
    updateOGTag('og:description', metadata.description);
    updateOGTag('og:url', `${SITE_URL}${canonicalPath}`);
    updateOGTag('og:image', siteImage);

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
    updateTwitterTag('twitter:image', siteImage);
    
    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', `${SITE_URL}${canonicalPath}`);
    
  }, [location.pathname]);
};

