import { useEffect } from 'react';

export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return;

    const original = document.body.style.cssText;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.cssText = original;
    };
  }, [active]);
}