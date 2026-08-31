import { useState, useEffect, useCallback } from 'react';
import { fetchAllRows } from '../services/supabase';
import { ALL_KEYS } from '../constants/schema';

export function useProductionData() {
  const [data, setData] = useState({
    job_active: [],
    rec_ctcp: [],
    rec_ctp: [],
    rec_screen: [],
    rec_flexo: [],
    rec_etching: [],
    master_user: []
  });
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState({});

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const results = {};
    const statuses = {};

    await Promise.all(
      ALL_KEYS.map(async (key) => {
        try {
          const rows = await fetchAllRows(key);
          results[key] = rows;
          statuses[key] = rows.length >= 0 ? 'live' : 'offline';
        } catch (err) {
          results[key] = [];
          statuses[key] = 'offline';
        }
      })
    );

    setData(results);
    setServerStatus(statuses);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return { data, loading, serverStatus, reload: loadAllData };
}