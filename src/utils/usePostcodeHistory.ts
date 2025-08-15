import { useState, useEffect } from 'react';

const HISTORY_KEY = 'postcodeHistory';
const MAX_HISTORY = 5;

export function usePostcodeHistory(enabled = true) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    }
  }, [enabled]);

  const saveToHistory = (postcode: string) => {
    if (!enabled) return;
    let newHistory = [postcode, ...history.filter(h => h !== postcode)].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  return { history, saveToHistory };
} 