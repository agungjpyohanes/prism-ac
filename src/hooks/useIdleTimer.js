import { useEffect, useRef } from 'react';

export function useIdleTimer({ active = true, onWarn, onTimeout, warnMs = 13 * 60 * 1000, timeoutMs = 15 * 60 * 1000 }) {
  const warnRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const resetTimers = () => {
      if (warnRef.current) clearTimeout(warnRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      warnRef.current = setTimeout(() => {
        if (onWarn) onWarn();
      }, warnMs);

      timeoutRef.current = setTimeout(() => {
        if (onTimeout) onTimeout();
      }, timeoutMs);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.removeEventListener(e, resetTimers));
    events.forEach(e => window.addEventListener(e, resetTimers));
    resetTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers));
      if (warnRef.current) clearTimeout(warnRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, onWarn, onTimeout, warnMs, timeoutMs]);
}