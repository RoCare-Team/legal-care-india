'use client';

import { useCallback, useState } from 'react';

/**
 * Reusable open/close state for menus, modals, drawers, accordions.
 *
 * @param {boolean} [initial=false]
 * @returns {{ isOpen: boolean, open: () => void, close: () => void, toggle: () => void }}
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, open, close, toggle };
}
