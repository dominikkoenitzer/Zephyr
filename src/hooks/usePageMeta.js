import { useEffect } from 'react';

const SITE = 'https://zephyr.punds.ch';

/** Create the tag once if the document does not already carry it. */
function upsert(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Give a route its own title, description and canonical URL.
 *
 * index.html can only describe one page, and every route is served from it.
 * So each route inherited the home page's title and, worse, its canonical
 * pointed at `/` — while sitemap.xml asks for `/tasks`, `/focus`, `/help` and
 * `/settings` to be indexed separately. The sitemap and the pages were telling
 * a crawler two different things.
 *
 * Set imperatively rather than by rendering tags: the tags already exist in
 * index.html, and rendering more would leave the document with two titles and
 * two canonicals rather than replacing them.
 */
export function usePageMeta({ title, description, path }) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      upsert('meta[name="description"]', () => {
        const el = document.createElement('meta');
        el.setAttribute('name', 'description');
        return el;
      }).setAttribute('content', description);
    }

    if (path) {
      upsert('link[rel="canonical"]', () => {
        const el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        return el;
      }).setAttribute('href', `${SITE}${path}`);
    }

    // Open Graph and Twitter describe whatever is shared. index.html only
    // describes the home page, so a link to /focus previewed as the home page.
    const social = [
      ['meta[property="og:title"]', 'property', 'og:title', title],
      ['meta[property="og:description"]', 'property', 'og:description', description],
      ['meta[property="og:url"]', 'property', 'og:url', path && `${SITE}${path}`],
      ['meta[name="twitter:title"]', 'name', 'twitter:title', title],
      ['meta[name="twitter:description"]', 'name', 'twitter:description', description],
      ['meta[name="twitter:url"]', 'name', 'twitter:url', path && `${SITE}${path}`],
    ];

    for (const [selector, attr, key, value] of social) {
      if (!value) continue;
      upsert(selector, () => {
        const el = document.createElement('meta');
        el.setAttribute(attr, key);
        return el;
      }).setAttribute('content', value);
    }
  }, [title, description, path]);
}

export default usePageMeta;
