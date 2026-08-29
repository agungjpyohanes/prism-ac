import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { TABLE_NAMES } from '../constants/schema';

export const useProductionData = () => {
  const [data, setData] = useState({
    rec_ctcp: [],
    rec_ctp: [],
    rec_screen: [],
    rec_flexo: [],
    rec_etching: [],
    jop_active: [],
    master_user: [],
    rec_user: [],
    ctcp: [],
    ctp: [],
    screen: [],
    flexo: [],
    etching: [],
    jobActive: []
  });

  const [period, setPeriod] = useState({ type: 'all', start: null, end: null });
  const [status, setStatus] = useState('online');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        ctcpRes,
        ctpRes,
        screenRes,
        flexoRes,
        etchingRes,
        jobActiveRes,
        usersRes
      ] = await Promise.all([
        supabase.from(TABLE_NAMES.CTCP).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.CTP).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.SCREEN).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.FLEXO).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.ETCHING).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.JOB_ACTIVE).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.USERS).select('*')
      ]);

      const ctcp = ctcpRes.data || [];
      const ctp = ctpRes.data || [];
      const screen = screenRes.data || [];
      const flexo = flexoRes.data || [];
      const etching = etchingRes.data || [];
      const jop_active = jobActiveRes.data || [];
      const users = usersRes.data || [];

      setData({
        rec_ctcp: ctcp,
        rec_ctp: ctp,
        rec_screen: screen,
        rec_flexo: flexo,
        rec_etching: etching,
        jop_active: jop_active,
        master_user: users,
        rec_user: users,
        ctcp,
        ctp,
        screen,
        flexo,
        etching,
        jobActive: jop_active
      });

      setStatus('online');
      setError(null);
    } catch (err) {
      console.error('Error fetching production data:', err);
      setStatus('offline');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    data,
    status,
    loading,
    period,
    setPeriod,
    reload: fetchAllData
  };
};