import { useState, useEffect, useCallback } from 'react';
import { fetchAllRows } from '../services/supabase';
import { ALL_KEYS, PROD_KEYS, SHEETS } from '../constants/schema';
import { parseDateVal } from '../utils/formatters';

export function useProductionData() {
  const [data, setData] = useState({});
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ from: null, to: null });

  const mapSupabaseRowToMatrix = (row, key) => {
    if (Array.isArray(row)) return row;

    const find = (...patterns) => {
      const keys = Object.keys(row);
      for (const p of patterns) {
        const cleanP = p.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanP);
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          return row[matchedKey];
        }
      }
      return '';
    };

    if (key === 'jop_active') {
      return [
        find('id'),
        find('job_name'),
        find('job_no'),
        find('file_no'),
        find('status'),
        find('start_time'),
        find('date'),
        find('category')
      ];
    }

    if (key === 'rec_ctcp') {
      return [
        find('id'),
        find('job_name'),
        find('job_no'),
        find('plate_no'),
        find('date'),
        find('expose_mach'),
        find('print_mach'),
        find('paper_type'),
        find('plate_size'),
        find('qty_new'),
        find('qty_replace'),
        find('qty_good'),
        find('qty_defect'),
        find('replace_reason'),
        find('special_request'),
        find('defect_reason'),
        find('notes'),
        find('shift'),
        find('operator'),
        find('po_helper')
      ];
    }

    if (key === 'rec_ctp') {
      return [
        find('id'),
        find('job_name'),
        find('job_no'),
        find('plate_no'),
        find('date'),
        find('expose_mach'),
        find('plate_size'),
        find('print_mach'),
        find('paper_type'),
        find('qty_new'),
        find('qty_replace'),
        find('qty_good'),
        find('qty_defect'),
        find('replace_reason'),
        find('special_request'),
        find('defect_reason'),
        find('notes'),
        find('shift'),
        find('operator')
      ];
    }

    if (key === 'rec_screen') {
      return [
        find('id'),
        find('job_name'),
        find('job_no'),
        find('file_no'),
        find('screen_type'),
        find('status'),
        find('start_time'),
        find('finish_time'),
        find('duration'),
        find('date'),
        find('description'),
        find('screen_mesh'),
        find('shift'),
        find('notes'),
        find('qty_good'),
        find('qty_defect'),
        find('qty_replace'),
        find('defect_reason'),
        find('replace_reason'),
        find('operator')
      ];
    }

    if (key === 'rec_flexo') {
      return [
        find('id'),
        find('job_name'),
        find('job_no'),
        find('file_no'),
        find('status'),
        find('start_time'),
        find('finish_time'),
        find('duration'),
        find('date'),
        find('description'),
        find('lpi'),
        find('flexo_thickness', 'thickness'),
        find('print_mach'),
        find('rip_pos'),
        find('keterangan'),
        find('notes'),
        find('qty_good'),
        find('qty_defect'),
        find('qty_replace'),
        find('defect_reason'),
        find('replace_reason'),
        find('shift'),
        find('operator'),
        find('po_helper')
      ];
    }

    if (key === 'rec_etching') {
      return [
        find('id'),
        find('job_name'),
        find('job_no'),
        find('file_no'),
        find('plate_type'),
        find('status'),
        find('start_time'),
        find('finish_time'),
        find('duration'),
        find('date'),
        find('description'),
        find('plate_thickness'),
        find('keterangan'),
        find('qty_good'),
        find('qty_defect'),
        find('qty_replace'),
        find('defect_reason'),
        find('replace_reason'),
        find('shift'),
        find('operator'),
        find('po_helper')
      ];
    }

    return Object.values(row);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const newData = {};
    const newStatus = {};

    try {
      await Promise.all(
        ALL_KEYS.map(async (k) => {
          try {
            const rows = await fetchAllRows(k);
            if (k === 'master_user') {
              newData[k] = (rows || []).map((r) => [
                String(r.username || r.user || '').trim(),
                String(r.role || 'guest').toLowerCase().trim(),
                String(r.password_hash || r.password || '').trim(),
                String(r.id || '').trim()
              ]);
            } else {
              newData[k] = (rows || []).map((row) => mapSupabaseRowToMatrix(row, k));
            }
            newStatus[k] = newData[k].length ? 'live' : 'empty';
          } catch (e) {
            newData[k] = [];
            newStatus[k] = 'fail';
          }
        })
      );

      setData(newData);
      setStatus(newStatus);

      // Sinkronisasi rentang tanggal awal
      const allTimestamps = [];
      [...PROD_KEYS, 'jop_active'].forEach((k) => {
        const cfg = SHEETS[k];
        if (cfg && cfg.i && newData[k]) {
          newData[k].forEach((r) => {
            const d = parseDateVal(r[cfg.i.date]);
            if (d && !isNaN(d.getTime())) {
              allTimestamps.push(d.getTime());
            }
          });
        }
      });

      if (allTimestamps.length > 0) {
        const maxDate = new Date(Math.max(...allTimestamps));
        const minDate = new Date(Math.min(...allTimestamps));
        const startOfMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

        setPeriod({
          from: startOfMonth < minDate ? minDate : startOfMonth,
          to: maxDate
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { data, status, loading, period, setPeriod, reload: loadAll };
}