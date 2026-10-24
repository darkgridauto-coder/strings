'use client';
import { useUser } from '@/components/UserProvider';

export function useSetting<T>(key: string, defaultValue: T) {
  const { user, patchUser } = useUser();
  
  const value = (user?.settings?.[key] ?? defaultValue) as T;
  
  const setValue = (newValue: T) => {
    patchUser({ settings: { ...user?.settings, [key]: newValue } });
  };

  return [value, setValue] as const;
}
