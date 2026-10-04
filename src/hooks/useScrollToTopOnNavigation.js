import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Bring the window back to the top whenever the page changes.
 *
 * The document itself scrolls, not a container inside the shell, and the
 * router leaves that position untouched between routes. Without this, a page
 * opened from the sidebar starts wherever the previous one had been scrolled
 * to, which on a phone often means halfway down an unrelated screen.
 *
 * Only the path is watched, so changing a filter kept in the query string
 * never makes the page jump. The layout effect runs before the browser paints,
 * so the new page is never shown at the old position, even for a frame.
 *
 * @returns {void}
 */
export function useScrollToTopOnNavigation() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}
