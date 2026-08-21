import { useSyncExternalStore } from 'react';

import { readMode, watchThemeMode } from './theme';

export const useThemeMode = () => {
  return useSyncExternalStore(
    (onChange) => watchThemeMode(() => onChange()),
    () => readMode(),
  );
};
