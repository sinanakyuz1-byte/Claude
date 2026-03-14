import { useState, useEffect, useCallback } from 'react';
import { getOutages } from '../services/api';
import { Outage, UserLocation } from '../types';

interface UseOutagesResult {
  outages: Outage[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refresh: () => void;
}

export function useOutages(location: UserLocation | null, type?: string): UseOutagesResult {
  const [outages, setOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getOutages({
        province: location.province,
        district: location.district,
        neighborhood: location.neighborhood,
        type,
      });
      setOutages(res.data);
      setLastUpdated(res.lastUpdated);
    } catch (err: any) {
      setError(err?.message || 'Veri alınamadı');
    } finally {
      setLoading(false);
    }
  }, [location?.province, location?.district, location?.neighborhood, type]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 5 * 60 * 1000); // 5 dk'da bir yenile
    return () => clearInterval(interval);
  }, [fetch]);

  return { outages, loading, error, lastUpdated, refresh: fetch };
}
