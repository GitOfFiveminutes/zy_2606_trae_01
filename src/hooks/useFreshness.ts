import { useMemo } from 'react';
import { calculateFreshness } from '@/utils/date';
import type { FreshnessInfo } from '@/types';

export function useFreshness(purchaseDate: string, shelfLifeDays: number): FreshnessInfo {
  return useMemo(
    () => calculateFreshness(purchaseDate, shelfLifeDays),
    [purchaseDate, shelfLifeDays]
  );
}
