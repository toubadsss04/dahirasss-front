import { useCallback, useRef, useState } from 'react';

/** Margin kept between the list and the edge of the window, in pixels. */
const EDGE_MARGIN = 16;

/** Below this much room under the field, the list opens above it when there is more room there. */
const MIN_ROOM_BELOW = 200;

/**
 * Place a dropdown list next to its field without ever covering it.
 *
 * Material UI keeps a list inside the window by sliding it up when there is
 * not enough room below, which lays it over the field and its label. Here the
 * room is measured when the list opens: the list goes below the field when it
 * fits, above it otherwise, and its height is capped to the room on that side.
 *
 * @param {number} maxHeight Tallest the list may grow.
 * @returns {{
 *   anchorRef: import('react').MutableRefObject<HTMLElement|null>,
 *   menuProps: object,
 *   onOpen: () => void,
 * }} What the dropdown needs.
 */
export function useDropdownPlacement(maxHeight) {
  const anchorRef = useRef(null);
  const [placement, setPlacement] = useState({ above: false, height: maxHeight });

  const onOpen = useCallback(() => {
    const field = anchorRef.current?.getBoundingClientRect();
    if (!field) return;
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    const below = viewport - field.bottom - EDGE_MARGIN;
    const above = field.top - EDGE_MARGIN;
    const opensAbove = below < Math.min(maxHeight, MIN_ROOM_BELOW) && above > below;
    setPlacement({
      above: opensAbove,
      height: Math.max(0, Math.min(maxHeight, opensAbove ? above : below)),
    });
  }, [maxHeight]);

  const menuProps = {
    anchorEl: () => anchorRef.current,
    anchorOrigin: { vertical: placement.above ? 'top' : 'bottom', horizontal: 'left' },
    transformOrigin: { vertical: placement.above ? 'bottom' : 'top', horizontal: 'left' },
    marginThreshold: 0,
    PaperProps: { style: { maxHeight: placement.height } },
  };

  return { anchorRef, menuProps, onOpen };
}
