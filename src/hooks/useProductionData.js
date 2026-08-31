import { useState, useEffect, useCallback } from 'react';
import { fetchAllRows } from '../services/supabase';
import { SHEETS, ALL_KEYS } from '../constants/schema';

function mapRowToMatrix(key, row) {
  if (!row) return [];
  if (Array.isArray(row)) return row;

  const findVal = (field) => {
    if (!field) return '';
    if (row[field] !== undefined && row[field] !== null) return row[field];
    
    const lower = field.toLowerCase();
    if (row[lower] !== undefined && row[lower] !== null) return row[lower];
    
    const noUnder = lower.replace(/_/g, '');
    for (const k of Object.keys(row)) {
      if (k.toLowerCase().replace(/_/g, '') === noUnder) {
        return row[k];
      }
    }
    return '';
  };

  if (key === 'master_user') {
    return [
      findVal('username') || findVal('user'),
      findVal('role') || 'operator',
      findVal('password_hash') || findVal('password'),
      String(findVal('id') || '1')
    ];
  }

  const schema = SHEETS[key] || SHEETS.job_active;
  if (!schema || !schema.headers) {
    return Object.values(row);
  }

  return schema.headers.map((h) => findVal(h));
}

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
          let rawRows = await fetchAllRows(key);
          
          // Fallback: Jika tabel di database Supabase bernama jop_active
          if ((!rawRows || rawRows.length === 0) && key === 'job_active') {
            const fallbackRows = await fetchAllRows('jop_active');
            if (fallbackRows && fallbackRows.length > 0) {
              rawRows = fallbackRows;
            }
          }

          const matrix = (rawRows || []).map((r) => mapRowToMatrix(key, r));
          results[key] = matrix;
          statuses[key] = matrix.length > 0 ? 'live' : 'live';
        } catch (err) {
          console.error(`Gagal load key ${key}:`, err);
          results[key] = [];
          statuses[key] = 'offline';
        }
      })
    );

    // Salin juga ke jop_active agar kompatibel di kedua sisi
    if (results.job_active) {
      results.jop_active = results.job_active;
    }

    setData(results);
    setServerStatus(statuses);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return { data, loading, serverStatus, reload: loadAllData };
}
