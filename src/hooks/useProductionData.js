import { useState, useEffect, useCallback } from 'react';
import { fetchAllRows } from '../services/supabase';
import { SHEETS, ALL_KEYS } from '../constants/schema';

function mapRowToMatrix(key, row) {
  if (!row) return [];
  if (Array.isArray(row)) return row;

  const aliases = {
    job_name: ['job_name', 'nama_pekerjaan', 'jop', 'nama_job', 'job', 'nama', 'pekerjaan'],
    job_no: ['job_no', 'no_jop', 'nojop', 'no_spk', 'spk', 'nomor_jop'],
    file_no: ['file_no', 'no_file', 'file', 'kd_file', 'kode_file'],
    status: ['status', 'stts', 'state', 'kondisi'],
    start_time: ['start_time', 'jam_mulai', 'mulai', 'waktu', 'time'],
    date: ['date', 'tgl', 'tanggal', 'created_at'],
    category: ['category', 'kategori', 'divisi', 'tipe', 'cat']
  };

  const findVal = (field) => {
    if (!field) return '';
    if (row[field] !== undefined && row[field] !== null) return row[field];

    const targetKey = field.toLowerCase();
    const aliasList = aliases[targetKey] || [targetKey];
    for (const a of aliasList) {
      if (row[a] !== undefined && row[a] !== null) return row[a];
    }

    const targetClean = targetKey.replace(/[^a-z0-9]/g, '');
    for (const k of Object.keys(row)) {
      if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === targetClean) {
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
          const rawRows = await fetchAllRows(key);
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

    setData(results);
    setServerStatus(statuses);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return { data, loading, serverStatus, reload: loadAllData };
}