import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Pencil,
  Save,
  RotateCcw,
  AlertCircle,
  Loader2,
  Database,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Activity,
  Clock
} from 'lucide-react';
import { SHEETS } from '../../constants/schema';
import { canMutateData } from '../../constants/navigation';
import { matrixRowToObject, updateProductionJob, detectTargetTable } from '../../services/productionService';
import { getDropdownOptions } from '../../constants/dropdownOptions';
import SelectWithCustom from './SelectWithCustom';
import {
  fmtDate,
  fmtStartTime,
  parseDateVal,
  formatYMD,
  cell,
  getStatusBadgeClass,
  getCategoryBadgeClass
} from '../../utils/formatters';

export default function ProductionDetailModal({
  modalState,
  currentUser,
  data = {},
  personilList = [],
  onClose,
  onDataMutated,
  onToast,
  onBack
}) {
  if (!modalState || !modalState.row) return null;
  const { key, row, withBack } = modalState;
  const cfg = SHEETS[key] || SHEETS.rec_ctcp;

  const isJobActive = key === 'job_active';
  const userRole = String(currentUser?.ROLE || currentUser?.role || 'tamu').toLowerCase().trim();
  const canEdit = canMutateData(userRole);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Target table detection (jika key adalah job_active)
  const targetTableKey = useMemo(() => {
    if (!isJobActive) return key;
    const rowObj = matrixRowToObject(key, row);
    return detectTargetTable(rowObj.id, rowObj.category) || 'rec_ctcp';
  }, [isJobActive, key, row]);

  // Context-aware dropdown options
  const opts = useMemo(() => {
    const tableForOpts = isJobActive ? targetTableKey : key;
    return getDropdownOptions(tableForOpts, data);
  }, [isJobActive, targetTableKey, key, data]);

  // Inisialisasi formData saat modal dibuka atau baris berganti
  useEffect(() => {
    if (row && key) {
      const obj = matrixRowToObject(key, row);

      // Jika job_active, coba cari padanan data lengkap di tabel lini produksi
      if (isJobActive && targetTableKey && data[targetTableKey]) {
        const fullMatch = (data[targetTableKey] || []).find((r) => {
          if (!r) return false;
          const rId = Array.isArray(r) ? r[0] : r.id;
          return String(rId).trim().toUpperCase() === String(obj.id).trim().toUpperCase();
        });
        if (fullMatch) {
          const fullObj = matrixRowToObject(targetTableKey, fullMatch);
          Object.assign(obj, fullObj);
        }
      }

      // Format tanggal ke YYYY-MM-DD untuk input date HTML
      if (obj.date) {
        const d = parseDateVal(obj.date);
        if (d) obj.date = formatYMD(d);
      }

      setFormData(obj);
      setIsEditing(false);
      setErrorMsg(null);
    }
  }, [row, key, isJobActive, targetTableKey, data]);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleNumberChange = (field, val) => {
    const numVal = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setFormData((prev) => ({ ...prev, [field]: numVal }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    if (row && key) {
      const obj = matrixRowToObject(key, row);
      if (obj.date) {
        const d = parseDateVal(obj.date);
        if (d) obj.date = formatYMD(d);
      }
      setFormData(obj);
    }
    setIsEditing(false);
    setErrorMsg(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validasi Field Wajib
    if (!formData.job_name?.trim()) {
      setErrorMsg('Nama Pekerjaan (Job Name) tidak boleh kosong.');
      return;
    }
    if (!formData.job_no?.trim()) {
      setErrorMsg('Nomor JOP (Job No) tidak boleh kosong.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProductionJob({
        tableKey: key,
        record: formData,
        userRole
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Gagal memperbarui data.');
        if (onToast) onToast(res.error || 'Gagal memperbarui data.', 'err');
        setSaving(false);
        return;
      }

      if (onToast) {
        onToast(res.message || 'Data berhasil diperbarui!', 'ok');
      }

      if (onDataMutated) {
        onDataMutated(key, 'update', res.data);
        if (res.targetTable && res.targetUpdated) {
          onDataMutated(res.targetTable, 'update', res.targetUpdated);
        }
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Update Error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
      if (onToast) onToast(err.message || 'Terjadi kesalahan sistem.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const isCtcp = key === 'rec_ctcp' || (isJobActive && targetTableKey === 'rec_ctcp');
  const isCtp = key === 'rec_ctp' || (isJobActive && targetTableKey === 'rec_ctp');
  const isScreen = key === 'rec_screen' || (isJobActive && targetTableKey === 'rec_screen');
  const isFlexo = key === 'rec_flexo' || (isJobActive && targetTableKey === 'rec_flexo');
  const isEtching = key === 'rec_etching' || (isJobActive && targetTableKey === 'rec_etching');

  const idVal = formData.id || cell(row, cfg.i?.id) || '—';
  const jobNameVal = formData.job_name || cell(row, cfg.i?.jop || cfg.i?.job_name) || '—';
  const jobNoVal = formData.job_no || cell(row, cfg.i?.nojop || cfg.i?.job_no) || '—';

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#030712]/85 transition-opacity"
        style={{
          WebkitBackdropFilter: 'blur(12px)',
          backdropFilter: 'blur(12px)'
        }}
        onClick={!saving ? onClose : undefined}
      />

      {/* Modal Dialog Card */}
      <div
        className="modal-panel relative w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden pointer-events-auto z-10 border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#0c1430]/95 shadow-2xl rounded-3xl"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          backdropFilter: 'blur(24px)'
        }}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="min-w-0 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl grid place-items-center bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 text-blue-600 dark:text-cyan-300 shrink-0">
              <Database className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <span className="truncate">{isEditing ? `Edit Data Langsung: ${idVal}` : `Detail Pekerjaan: ${idVal}`}</span>
                <span className="badge shrink-0 bg-blue-500/20 text-blue-600 dark:text-cyan-300 border-blue-400/30 font-bold text-xs">
                  {cfg.label}
                </span>
                {!canEdit && (
                  <span className="badge shrink-0 bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-400/30 font-medium text-[10px] flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Read-Only
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-600 dark:text-cyan-300 font-medium mt-0.5 truncate">
                {jobNameVal} ({jobNoVal})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tombol Edit Data Langsung (Hanya jika user memiliki role prepress, manager, developer) */}
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-primary !py-1.5 !px-3.5 text-xs font-bold flex items-center gap-1.5 rounded-xl shadow-sm hover:scale-[1.02] transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Data Langsung</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-rose-500/30 transition disabled:opacity-50"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Modal */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800 dark:text-slate-200 flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {withBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary !py-1.5 !px-3 text-xs mb-2 flex items-center gap-1.5 inline-flex rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar
            </button>
          )}

          {/* ======================================================== */}
          {/* MODE EDIT FORM (JIKA isEditing TRUE) */}
          {/* ======================================================== */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Section 1: Identitas & Status Utama */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                    1. Identitas Transaksi &amp; Status
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ID Transaksi (Terkunci)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.id || ''}
                      className="inp w-full font-mono text-xs font-bold opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                    />
                  </div>

                  {/* Status Pengerjaan (Dropdown Dinamis) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Pengerjaan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.status || 'ANTRI'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="inp w-full text-xs font-bold text-blue-600 dark:text-cyan-300"
                    >
                      {formData.status && !opts.statuses.includes(formData.status) && (
                        <option value={formData.status}>{formData.status} (Tersimpan)</option>
                      )}
                      {opts.statuses.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* Kategori Lini (Jika job_active) */}
                  {isJobActive && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Kategori Divisi / Lini
                      </label>
                      <select
                        value={formData.category || 'OFFSET'}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="inp w-full text-xs font-semibold"
                      >
                        {formData.category && !opts.categories.includes(formData.category) && (
                          <option value={formData.category}>{formData.category} (Tersimpan)</option>
                        )}
                        {opts.categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Produksi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date || ''}
                      onChange={(e) => handleChange('date', e.target.value)}
                      className="inp w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Job No / No JOP <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.job_no || ''}
                      onChange={(e) => handleChange('job_no', e.target.value)}
                      className="inp w-full font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isCtcp || isCtp ? 'Plate No' : 'File No'}
                    </label>
                    <input
                      type="text"
                      value={(isCtcp || isCtp ? formData.plate_no : formData.file_no) || ''}
                      onChange={(e) => handleChange(isCtcp || isCtp ? 'plate_no' : 'file_no', e.target.value)}
                      className="inp w-full font-mono text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Pekerjaan (Job Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.job_name || ''}
                      onChange={(e) => handleChange('job_name', e.target.value)}
                      className="inp w-full text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Spesifikasi Mesin & Teknis (Dropdown Dinamis) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                    2. Spesifikasi Mesin &amp; Teknis
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Mesin Expose / RIP POS Dropdown */}
                  {isFlexo ? (
                    <SelectWithCustom
                      label="RIP POS"
                      value={formData.rip_pos || ''}
                      onChange={(val) => handleChange('rip_pos', val)}
                      options={opts.ripPoss || []}
                      placeholder="-- Pilih RIP POS --"
                      customPlaceholder="Ketik RIP POS manual..."
                    />
                  ) : (
                    <SelectWithCustom
                      label="Mesin Expose"
                      value={formData.expose_mach || ''}
                      onChange={(val) => handleChange('expose_mach', val)}
                      options={opts.exposeMachines}
                      placeholder="-- Pilih Mesin Expose --"
                      customPlaceholder="Ketik mesin expose manual..."
                    />
                  )}

                  {/* Mesin Cetak Dropdown */}
                  <SelectWithCustom
                    label="Mesin Cetak"
                    value={formData.print_mach || ''}
                    onChange={(val) => handleChange('print_mach', val)}
                    options={opts.printMachines}
                    placeholder="-- Pilih Mesin Cetak --"
                    customPlaceholder="Ketik mesin cetak manual..."
                  />

                  {/* Ukuran Plate Dropdown */}
                  <SelectWithCustom
                    label="Ukuran Plate"
                    value={formData.plate_size || ''}
                    onChange={(val) => handleChange('plate_size', val)}
                    options={opts.plateSizes}
                    placeholder="-- Pilih Ukuran Plate --"
                    customPlaceholder="Ketik ukuran plate manual..."
                  />

                  {/* Jenis Kertas Dropdown */}
                  <SelectWithCustom
                    label="Jenis Kertas / Bahan"
                    value={formData.paper_type || ''}
                    onChange={(val) => handleChange('paper_type', val)}
                    options={opts.paperTypes}
                    placeholder="-- Pilih Jenis Kertas --"
                    customPlaceholder="Ketik jenis kertas manual..."
                  />

                  {/* Tipe Screen / Mesh */}
                  {isScreen && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tipe Screen
                        </label>
                        <select
                          value={formData.screen_type || ''}
                          onChange={(e) => handleChange('screen_type', e.target.value)}
                          className="inp w-full text-xs font-medium"
                        >
                          <option value="">-- Pilih Tipe Screen --</option>
                          {formData.screen_type && !opts.screenTypes.includes(formData.screen_type) && (
                            <option value={formData.screen_type}>{formData.screen_type} (Tersimpan)</option>
                          )}
                          {opts.screenTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <SelectWithCustom
                        label="Screen Mesh"
                        value={formData.screen_mesh || ''}
                        onChange={(val) => handleChange('screen_mesh', val)}
                        options={opts.screenMeshes}
                        placeholder="-- Pilih Screen Mesh --"
                        customPlaceholder="Ketik screen mesh manual..."
                      />
                    </>
                  )}

                  {/* Flexo Tebal & LPI */}
                  {isFlexo && (
                    <>
                      <SelectWithCustom
                        label="Tebal Flexo"
                        value={formData.flexo_thickness || ''}
                        onChange={(val) => handleChange('flexo_thickness', val)}
                        options={opts.flexoThicknesses}
                        placeholder="-- Pilih Tebal Flexo --"
                        customPlaceholder="Ketik tebal flexo manual..."
                      />
                      <SelectWithCustom
                        label="LPI"
                        value={formData.lpi || ''}
                        onChange={(val) => handleChange('lpi', val)}
                        options={opts.lpis}
                        placeholder="-- Pilih LPI --"
                        customPlaceholder="Ketik LPI manual..."
                      />
                    </>
                  )}

                  {/* Etching Tipe & Tebal */}
                  {isEtching && (
                    <>
                      <SelectWithCustom
                        label="Tipe Plate Etching"
                        value={formData.plate_type || ''}
                        onChange={(val) => handleChange('plate_type', val)}
                        options={opts.plateTypes}
                        placeholder="-- Pilih Tipe Plate --"
                        customPlaceholder="Ketik tipe plate manual..."
                      />
                      <SelectWithCustom
                        label="Tebal Plate"
                        value={formData.plate_thickness || ''}
                        onChange={(val) => handleChange('plate_thickness', val)}
                        options={opts.plateThicknesses}
                        placeholder="-- Pilih Tebal Plate --"
                        customPlaceholder="Ketik tebal plate manual..."
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Section 3: Kuantitas Output */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                    3. Kuantitas Output ({cfg.unit || 'Plate'})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
                    <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      Qty Baik (Good)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.qty_good ?? ''}
                      onChange={(e) => handleNumberChange('qty_good', e.target.value)}
                      className="inp w-full text-sm font-bold text-emerald-600 dark:text-emerald-400 !border-emerald-300 dark:!border-emerald-500/40"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30">
                    <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
                      Qty Rusak (Defect)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.qty_defect ?? ''}
                      onChange={(e) => handleNumberChange('qty_defect', e.target.value)}
                      className="inp w-full text-sm font-bold text-rose-600 dark:text-rose-400 !border-rose-300 dark:!border-rose-500/40"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30">
                    <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                      Qty Ganti (Reprint)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.qty_replace ?? ''}
                      onChange={(e) => handleNumberChange('qty_replace', e.target.value)}
                      className="inp w-full text-sm font-bold text-amber-600 dark:text-amber-400 !border-amber-300 dark:!border-amber-500/40"
                    />
                  </div>

                  {(isCtcp || isCtp) && (
                    <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-cyan-950/20 border border-blue-200 dark:border-cyan-500/30">
                      <label className="block text-xs font-bold text-blue-700 dark:text-cyan-400 mb-1">
                        Qty Baru (New)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.qty_new ?? ''}
                        onChange={(e) => handleNumberChange('qty_new', e.target.value)}
                        className="inp w-full text-sm font-bold text-blue-600 dark:text-cyan-400 !border-blue-300 dark:!border-cyan-500/40"
                      />
                    </div>
                  )}
                </div>

                {/* Dropdowns Alasan Defect, Ganti & Permintaan Khusus */}
                <div className={`grid grid-cols-1 ${(isCtcp || isCtp) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 pt-1`}>
                  <SelectWithCustom
                    label="Penyebab Rusak (Defect Reason)"
                    value={formData.defect_reason || ''}
                    onChange={(val) => handleChange('defect_reason', val)}
                    options={opts.defectReasons}
                    placeholder="-- Pilih Penyebab Rusak --"
                    customPlaceholder="Ketik alasan defect manual..."
                  />
                  <SelectWithCustom
                    label="Penyebab Ganti (Replace Reason)"
                    value={formData.replace_reason || ''}
                    onChange={(val) => handleChange('replace_reason', val)}
                    options={opts.replaceReasons}
                    placeholder="-- Pilih Penyebab Ganti --"
                    customPlaceholder="Ketik alasan ganti manual..."
                  />
                  {(isCtcp || isCtp) && (
                    <SelectWithCustom
                      label="Permintaan Khusus (Special Request)"
                      value={formData.special_request || ''}
                      onChange={(val) => handleChange('special_request', val)}
                      options={opts.specialRequests || []}
                      placeholder="-- Pilih / Kosong --"
                      customPlaceholder="Ketik permintaan khusus manual..."
                    />
                  )}
                </div>
              </div>

              {/* Section 4: Personil & Catatan (Dropdown Dinamis) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                    4. Personil &amp; Catatan
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Shift Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Shift Kerja
                    </label>
                    <select
                      value={formData.shift || 'SHIFT A'}
                      onChange={(e) => handleChange('shift', e.target.value)}
                      className="inp w-full text-xs font-semibold"
                    >
                      <option value="SHIFT A">SHIFT A</option>
                      <option value="SHIFT B">SHIFT B</option>
                      <option value="SHIFT C">SHIFT C</option>
                      <option value="NON-SHIFT">NON-SHIFT</option>
                    </select>
                  </div>

                  {/* Operator Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Operator
                    </label>
                    <select
                      value={formData.operator || ''}
                      onChange={(e) => handleChange('operator', e.target.value)}
                      className="inp w-full text-xs font-medium"
                    >
                      <option value="">-- Pilih Operator --</option>
                      {formData.operator && !opts.operators.includes(formData.operator) && (
                        <option value={formData.operator}>{formData.operator} (Tersimpan)</option>
                      )}
                      {opts.operators.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>

                  {/* PO / Helper Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PO / Helper
                    </label>
                    <select
                      value={formData.po_helper || ''}
                      onChange={(e) => handleChange('po_helper', e.target.value)}
                      className="inp w-full text-xs font-medium"
                    >
                      <option value="">-- Pilih PO / Helper --</option>
                      {formData.po_helper && !opts.helpers.includes(formData.po_helper) && (
                        <option value={formData.po_helper}>{formData.po_helper} (Tersimpan)</option>
                      )}
                      {opts.helpers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Catatan / Keterangan
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes || formData.keterangan || ''}
                      onChange={(e) => {
                        handleChange('notes', e.target.value);
                        handleChange('keterangan', e.target.value);
                      }}
                      className="inp w-full text-xs resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Simpan & Batal Edit */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCancelEdit}
                  className="btn-secondary text-xs py-2.5 px-4 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2.5 px-6 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Perubahan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ======================================================== */
            /* MODE BACA (READ-ONLY DETAIL VIEW) */
            /* ======================================================== */
            <div className="space-y-5">
              {/* Highlight Status & Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="card p-3.5 bg-blue-50/60 dark:bg-cyan-950/20 border-blue-200 dark:border-cyan-500/30">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-cyan-400">
                    <span>Status</span>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="mt-1 font-display font-black text-xl text-blue-600 dark:text-cyan-300">
                    <span className={`badge ${getStatusBadgeClass(formData.status || cell(row, cfg.i?.status))} font-bold`}>
                      {formData.status || cell(row, cfg.i?.status) || 'SELESAI'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Tahapan pengerjaan</div>
                </div>

                <div className="card p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    <span>Qty Baik</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="mt-1 font-display font-black text-2xl text-emerald-600 dark:text-emerald-400">
                    {formData.qty_good ?? (cell(row, cfg.i?.baik) || '0')}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{cfg.unit || 'Plate'} selesai</div>
                </div>

                <div className="card p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    <span>Qty Defect</span>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="mt-1 font-display font-black text-2xl text-rose-600 dark:text-rose-400">
                    {formData.qty_defect ?? (cell(row, cfg.i?.rusak) || '0')}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Plate rusak / loss</div>
                </div>

                <div className="card p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    <span>Qty Replace</span>
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="mt-1 font-display font-black text-2xl text-amber-600 dark:text-amber-400">
                    {formData.qty_replace ?? (cell(row, cfg.i?.ganti) || '0')}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Reprint pengganti</div>
                </div>
              </div>

              {/* Grid Rincian Seluruh Field */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                {cfg.headers.map((h, i) => {
                  const v = formData[h] !== undefined ? formData[h] : row[i];
                  const isDate = i === cfg.i?.date || h === 'date';
                  const isStartTime = i === cfg.i?.start_time || h === 'start_time';
                  const isStatus = i === cfg.i?.status || h === 'status';
                  const isCat = i === cfg.i?.category || h === 'category';

                  let valDisplay = (v == null || v === '' || String(v).toUpperCase() === 'NULL') ? (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  ) : (
                    String(v)
                  );

                  if (isDate) valDisplay = fmtDate(parseDateVal(v));
                  if (isStartTime) valDisplay = fmtStartTime(v);
                  if (isStatus) valDisplay = <span className={`badge ${getStatusBadgeClass(v)} font-bold`}>{v || 'ANTRI'}</span>;
                  if (isCat) valDisplay = <span className={`badge ${getCategoryBadgeClass(v)} font-bold`}>{v}</span>;

                  return (
                    <div key={h} className="border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
                      <div className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-cyan-400 uppercase">
                        {h.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 break-words">
                        {valDisplay}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
