import React, { useState, useEffect } from 'react';
import { checkTableConnection, loginUser } from '../../services/supabase';
import { TABLE_NAMES } from '../../constants/schema';

export default function AuthView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [tableStatus, setTableStatus] = useState({
    ctcp: 'mencari...',
    ctp: 'mencari...',
    screen: 'mencari...',
    flexo: 'mencari...',
    etching: 'mencari...',
    user: 'mencari...'
  });

  useEffect(() => {
    const checkAllTables = async () => {
      const [ctcp, ctp, screen, flexo, etching, user] = await Promise.all([
        checkTableConnection(TABLE_NAMES.CTCP),
        checkTableConnection(TABLE_NAMES.CTP),
        checkTableConnection(TABLE_NAMES.SCREEN),
        checkTableConnection(TABLE_NAMES.FLEXO),
        checkTableConnection(TABLE_NAMES.ETCHING),
        checkTableConnection(TABLE_NAMES.USERS)
      ]);

      setTableStatus({
        ctcp: ctcp.success ? 'terhubung' : 'gagal',
        ctp: ctp.success ? 'terhubung' : 'gagal',
        screen: screen.success ? 'terhubung' : 'gagal',
        flexo: flexo.success ? 'terhubung' : 'gagal',
        etching: etching.success ? 'terhubung' : 'gagal',
        user: user.success ? 'terhubung' : 'gagal'
      });
    };

    checkAllTables();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await loginUser(username, password);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.message || 'Login gagal. Periksa username dan password.');
    }
  };

  return (
    // ... Render Form Login Anda ...
    <div className="status-grid grid grid-cols-2 gap-2 text-xs mt-4">
      {Object.entries(tableStatus).map(([key, status]) => (
        <div key={key} className="flex items-center space-x-1">
          <span className={`inline-block w-2 h-2 rounded-full ${status === 'terhubung' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className="uppercase text-slate-600 font-semibold">{key}</span>
          <span className="text-slate-400">{status}</span>
        </div>
      ))}
    </div>
  );
}