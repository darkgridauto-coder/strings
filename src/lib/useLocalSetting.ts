'use client';
import { useEffect, useState } from 'react';

export function useLocalSetting<T>(key: string, initial: T) {
  const [value, setValueState] = useState<T>(initial);
  useEffect(() => {
    try {
      const s = localStorage.getItem(key);
      if (s !== null) setValueState(JSON.parse(s) as T);
    } catch {}
  }, [key]);
  function setValue(v: T) {
    setValueState(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }
  return [value, setValue] as const;
}
