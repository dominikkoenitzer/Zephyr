import { useCallback, useEffect, useRef } from 'react';

/**
 * Marks a horizontal scroller with `data-more-left` / `data-more-right` while
 * there is more to see that way, so CSS can fade that edge (`.scroll-edges`).
 * A row that simply stopped at the screen edge gave no sign it went on.
 *
 * `active` is whatever decides the selected item: when it changes, the
 * selected button (`aria-pressed="true"`) is scrolled into view.
 */
export function useScrollEdges(active) {
  const nodeRef = useRef(null);

  const update = useCallback(() => {
    const el = nodeRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.toggleAttribute('data-more-left', el.scrollLeft > 1);
    el.toggleAttribute('data-more-right', el.scrollLeft < max - 1);
  }, []);

  const ref = useCallback((el) => {
    nodeRef.current = el;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [update]);

  useEffect(() => {
    const el = nodeRef.current;
    const selected = el?.querySelector('[aria-pressed="true"]');
    if (!selected) return;
    const box = el.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    if (item.left < box.left || item.right > box.right) {
      el.scrollBy({ left: item.left < box.left ? item.left - box.left - 8 : item.right - box.right + 8, behavior: 'smooth' });
    }
  }, [active]);

  return ref;
}

export default useScrollEdges;
