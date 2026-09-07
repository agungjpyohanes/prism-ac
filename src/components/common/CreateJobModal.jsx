import React, { useState, useEffect, useMemo } from 'react';
import { X, PlusCircle, Save, AlertCircle, Loader2 } from 'lucide-react';
import { SHEETS } from '../../constants/schema';
import { generateNextId, createProductionJob } from '../../services/productionService';
import { getDropdownOptions } from '../../constants/dropdownOptions';
import { formatYMD } from '../../utils/formatters';
import SelectWithCustom from './SelectWithCustom';

export default function CreateJobModal({
  isOpen,
  onClose,
  tableKey = 'rec_ctcp',
  existingRows = [],
  data = {},
  personilList = [],
  currentUser,
  onCreated,
  onToast
}) {
  const cfg = SHEETS[tableKey] || SHEETS.rec_ctcp;
  const userRole = String(currentUser?.ROLE || currentUser?.role || 'tamu').toLowerCase().trim();

  // Dynamic Context-Aware Dropdown Options per Lini Mesin
  const opts = useMemo(() => {
    return getDropdownOptions(tableKey, data);
  }, [tableKey, data]);

  // Initial Form Values
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Generate Suggested ID & Default Values saat modal dibuka atau tab berubah
  useEffect(() => {
    if (!isOpen) return;

    const nextId = generateNextId(tableKey, existingRows);
    const todayStr = formatYMD(new Date());

    // Default Operator dari User Login jika cocok
    const defaultOperator = currentUser?.username || currentUser?.USER || '';

    const initial = {
      id: nextId,
      date: todayStr,
      job_name: '',
      job_no: '',
      plate_no: '',
      file_no: '',
      expose_mach: opts.exposeMachines?.[0] || '',
      print_mach: opts.printMachines?.[0] || '',
      paper_type: opts.paperTypes?.[0] || '',
      plate_size: opts.plateSizes?.[0] || '',
      screen_type: opts.screenTypes?.[0] || '',
      screen_mesh: opts.screenMeshes?.[0] || '',
      flexo_thickness: opts.flexoThicknesses?.[0] || '',
      plate_thickness: opts.plateThicknesses?.[0] || '',
      plate_type: opts.plateTypes?.[0] || '',
      lpi: opts.lpis?.[0] || '',
      description: '',
      rip_pos: '',
      status: 'SELESAI',
      start_time: '',
      finish_time: '',
      duration: '',
      qty_new: 0,
      qty_replace: 0,
      qty_good: 0,
      qty_defect: 0,
      replace_reason: '',
      defect_reason: '',
      special_request: '',
      shift: 'SHIFT A',
      operator: defaultOperator,
      po_helper: '',
      notes: '',
      keterangan: ''
    };

    setFormData(initial);
    setErrorMsg(null);
  }, [isOpen, tableKey, existingRows, currentUser, opts]);

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleNumberChange = (field, val) => {
    const numVal = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setFormData((prev) => ({ ...prev, [field]: numVal }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validasi Wajib
    if (!formData.id?.trim()) {
      setErrorMsg('ID Pekerjaan tidak boleh kosong.');
      return;
    }
    if (!formData.job_name?.trim()) {
      setErrorMsg('Job Name / Nama Pekerjaan wajib diisi.');
      return;
    }
    if (!formData.job_no?.trim()) {
      setErrorMsg('Job No / Nomor JOP wajib diisi.');
      return;
    }
    if (!formData.date) {
      setErrorMsg('Tanggal pengerjaan wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const res = await createProductionJob({
        tableKey,
        record: formData,
        userRole
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Gagal menyimpan data.');
        if (onToast) onToast(res.error || 'Gagal menyimpan data.', 'err');
        setSaving(false);
        return;
      }

      if (onToast) {
        onToast(res.message || 'Job baru berhasil ditambahkan!', 'ok');
      }

      if (onCreated) {
        onCreated(res.data);
      }

      onClose();
    } catch (err) {
      console.error('Submit Error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
      if (onToast) onToast(err.message || 'Terjadi kesalahan sistem.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const isCtcp = tableKey === 'rec_ctcp';
  const isCtp = tableKey === 'rec_ctp';
  const isScreen = tableKey === 'rec_screen';
  const isFlexo = tableKey === 'rec_flexo';
  const isEtching = tableKey === 'rec_etching';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#030712]/85 transition-opacity"
        style={{
          WebkitBackdropFilter: 'blur(12px)',
          backdropFilter: 'blur(12px)'
        }}
        onClick={!saving ? onClose : undefined}
      />

      {/* Modal Dialog Container */}
      <div
        className="modal-panel relative w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden pointer-events-auto z-10 border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#0c1430]/95 shadow-2xl rounded-3xl"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          backdropFilter: 'blur(24px)'
        }}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl grid place-items-center bg-blue-50 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/30">
              <PlusCircle className="w-5 h-5" />
            </span>
            <div>
              <div className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                <span>Tambah Job Baru</span>
                <span className="badge bg-blue-500/20 text-blue-600 dark:text-cyan-400 border-blue-400/30 font-bold text-xs">
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Input data transaksi baru &bull; Sinkronisasi otomatis ke Supabase &amp; Google Sheets
              </p>
            </div>
          </div>

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

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-slate-800 dark:text-slate-200" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* Section 1: Identitas Transaksi */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                1. Identitas Transaksi &amp; Pekerjaan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ID Transaksi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.id || ''}
                  onChange={(e) => handleChange('id', e.target.value.toUpperCase())}
                  placeholder="Contoh: CTCP28469"
                  className="inp w-full font-mono text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Auto-generate ID unik sistem
                </span>
              </div>

              {/* Tanggal */}
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

              {/* Job No / JOP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Job No / No JOP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_no || ''}
                  onChange={(e) => handleChange('job_no', e.target.value)}
                  placeholder="Contoh: 7B621955"
                  className="inp w-full font-mono text-xs"
                />
              </div>

              {/* Job Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pekerjaan (Job Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_name || ''}
                  onChange={(e) => handleChange('job_name', e.target.value)}
                  placeholder="Masukkan nama job / item pengerjaan..."
                  className="inp w-full text-xs font-semibold"
                />
              </div>

              {/* Plate No / File No */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isCtcp || isCtp ? 'Plate No' : 'File No'}
                </label>
                <input
                  type="text"
                  value={(isCtcp || isCtp ? formData.plate_no : formData.file_no) || ''}
                  onChange={(e) => handleChange(isCtcp || isCtp ? 'plate_no' : 'file_no', e.target.value)}
                  placeholder={isCtcp || isCtp ? 'Contoh: C06X053892' : 'Contoh: F00123'}
                  className="inp w-full font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Mesin & Spesifikasi Teknis (Dependent Dropdowns) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                2. Mesin &amp; Spesifikasi Teknis ({cfg.label})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Expose Machine Dropdown (CTCP & CTP) */}
              {(isCtcp || isCtp) && (
                <SelectWithCustom
                  label="Mesin Expose"
                  value={formData.expose_mach || ''}
                  onChange={(val) => handleChange('expose_mach', val)}
                  options={opts.exposeMachines}
                  placeholder="-- Pilih Mesin Expose --"
                  customPlaceholder="Ketik mesin expose manual..."
                />
              )}

              {/* RIP POS Dropdown (Khusus Flexo) */}
              {isFlexo && (
                <SelectWithCustom
                  label="RIP POS"
                  value={formData.rip_pos || ''}
                  onChange={(val) => handleChange('rip_pos', val)}
                  options={opts.ripPoss || []}
                  placeholder="-- Pilih RIP POS --"
                  customPlaceholder="Ketik RIP POS manual..."
                />
              )}

              {/* Print Machine Dropdown */}
              {(isCtcp || isCtp || isFlexo) && (
                <SelectWithCustom
                  label="Mesin Cetak"
                  value={formData.print_mach || ''}
                  onChange={(val) => handleChange('print_mach', val)}
                  options={opts.printMachines}
                  placeholder="-- Pilih Mesin Cetak --"
                  customPlaceholder="Ketik mesin cetak manual..."
                />
              )}

              {/* Plate Size Dropdown (CTCP & CTP) */}
              {(isCtcp || isCtp) && (
                <SelectWithCustom
                  label="Ukuran Plate"
                  value={formData.plate_size || ''}
                  onChange={(val) => handleChange('plate_size', val)}
                  options={opts.plateSizes}
                  placeholder="-- Pilih Ukuran Plate --"
                  customPlaceholder="Ketik ukuran plate manual..."
                />
              )}

              {/* Jenis Kertas / Substrat Dropdown (CTCP & CTP) */}
              {(isCtcp || isCtp) && (
                <SelectWithCustom
                  label="Jenis Kertas / Bahan"
                  value={formData.paper_type || ''}
                  onChange={(val) => handleChange('paper_type', val)}
                  options={opts.paperTypes}
                  placeholder="-- Pilih Jenis Kertas --"
                  customPlaceholder="Ketik jenis kertas manual..."
                />
              )}

              {/* Tipe Screen & Mesh Dropdowns (Screen) */}
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
                    label="Screen Mesh (Kerapatan)"
                    value={formData.screen_mesh || ''}
                    onChange={(val) => handleChange('screen_mesh', val)}
                    options={opts.screenMeshes}
                    placeholder="-- Pilih Kerapatan Mesh --"
                    customPlaceholder="Ketik kerapatan mesh manual..."
                  />
                </>
              )}

              {/* Flexo Tebal & LPI Dropdowns (Flexo) */}
              {isFlexo && (
                <>
                  <SelectWithCustom
                    label="Ketebalan Flexo"
                    value={formData.flexo_thickness || ''}
                    onChange={(val) => handleChange('flexo_thickness', val)}
                    options={opts.flexoThicknesses}
                    placeholder="-- Pilih Tebal Flexo --"
                    customPlaceholder="Ketik tebal flexo manual..."
                  />
                  <SelectWithCustom
                    label="LPI (Resolusi)"
                    value={formData.lpi || ''}
                    onChange={(val) => handleChange('lpi', val)}
                    options={opts.lpis}
                    placeholder="-- Pilih Resolusi LPI --"
                    customPlaceholder="Ketik LPI manual..."
                  />
                </>
              )}

              {/* Etching Tipe & Tebal Dropdowns (Etching) */}
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
                    label="Ketebalan Plate"
                    value={formData.plate_thickness || ''}
                    onChange={(val) => handleChange('plate_thickness', val)}
                    options={opts.plateThicknesses}
                    placeholder="-- Pilih Tebal Plate --"
                    customPlaceholder="Ketik tebal plate manual..."
                  />
                </>
              )}

              {/* Status Pengerjaan */}
              {(isScreen || isFlexo || isEtching) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Pengerjaan
                  </label>
                  <select
                    value={formData.status || 'SELESAI'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="inp w-full text-xs font-bold"
                  >
                    <option value="SELESAI">SELESAI</option>
                    <option value="PROSES">PROSES</option>
                    <option value="ANTRI">ANTRI</option>
                  </select>
                </div>
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
              {/* Qty Good (Baik) */}
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

              {/* Qty Defect (Rusak) */}
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

              {/* Qty Replace (Ganti) */}
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

              {/* Qty New (CTCP & CTP) */}
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

            {/* Penyebab Rusak, Ganti & Permintaan Khusus */}
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

          {/* Section 4: Personil & Catatan (Standard Dropdowns) */}
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

              {/* Operator Dropdown (Dari Master Personil & History) */}
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

              {/* PO / Helper Dropdown (Dari Master Personil & History) */}
              {(isCtcp || isFlexo || isEtching) && (
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
              )}

              {/* Notes / Keterangan */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || formData.keterangan || ''}
                  onChange={(e) => {
                    handleChange('notes', e.target.value);
                    handleChange('keterangan', e.target.value);
                  }}
                  placeholder="Tambahkan catatan khusus pengerjaan jika ada..."
                  className="inp w-full text-xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Tombol Aksi */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="btn-secondary text-xs py-2.5 px-4 rounded-xl font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs py-2.5 px-6 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Sistem...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Job Baru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
