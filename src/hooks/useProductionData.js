import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TABLE_NAMES } from '../constants/schema';

export const useProductionData = () => {
  const [data, setData] = useState({
    ctcp: [],
    ctp: [],
    screen: [],
    flexo: [],
    etching: [],
    jobActive: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [
        ctcpRes, 
        ctpRes, 
        screenRes, 
        flexoRes, 
        etchingRes, 
        jobActiveRes
      ] = await Promise.all([
        supabase.from(TABLE_NAMES.CTCP).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.CTP).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.SCREEN).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.FLEXO).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.ETCHING).select('*').order('date', { ascending: false }),
        supabase.from(TABLE_NAMES.JOB_ACTIVE).select('*').order('date', { ascending: false })
      ]);

      setData({
        ctcp: ctcpRes.data || [],
        ctp: ctpRes.data || [],
        screen: screenRes.data || [],
        flexo: flexoRes.data || [],
        etching: etchingRes.data || [],
        jobActive: jobActiveRes.data || []
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return { data, loading, error, refetch: fetchAllData };
};