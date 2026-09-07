import React, { useState, useMemo } from 'react';
import { FORMS, SHEETS } from '../../constants/schema';
import { getDropdownOptions } from '../../constants/dropdownOptions';
import SelectWithCustom from '../common/SelectWithCustom';
import { submitWorkRequest } from '../../services/productionService';
import {
  FileText,
  ExternalLink,
  Copy,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
  Printer,
  Frame,
  Package,
  Sparkles,
  Layers,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function WorkRequestView({
  data = {},
  user,
  onToast,
  onDataMutated,
  onMenuChange
}) {
  const [activeTab, setActiveTab] = useState('rec_screen');
  const [formMode, setFormMode] = useState('webapp'); // 'webapp' | 'google_form'
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Inisialisasi state form awal
  const initialFormState = useMemo(() => ({
    job_name: '',
    job_no: '',
    file_no: '',
    date: todayStr,
    requested_by: user?.nama_lengkap || user?.username || '',
    description: '',
    keterangan: '',
    notes: '',

    // Screen
    screen_type: '',
    screen_mesh: '',

    // Flexo
    lpi: '',
    flexo_thickness: '',
    print_mach: '',
    rip_pos: '',

    // Etching
    plate_type: '',
    plate_thickness: ''
  }), [todayStr, user]);

  const [formData, setFormData] = useState(initialFormState);

  // Opsi dropdown dinamis sesuai divisi yang aktif
  const opts = useMemo(() => {
    return getDropdownOptions(activeTab, data);
  }, [activeTab, data]);

  // Data config form & division
  const currentFormConfig = useMemo(() => {
    return FORMS.find((f) => f.key === activeTab) || FORMS[0];
  }, [activeTab]);

  const isCtcpOrCtp = activeTab === 'rec_ctcp' || activeTab === 'rec_ctp';

  const handleTabSelect = (key) => {
    setActiveTab(key);
    setErrorInfo(null);
    setSuccessInfo(null);
    if (key === 'rec_ctcp' || key === 'rec_ctp') {
      setFormMode('google_form');
    } else {
      setFormMode('webapp');
    }
  };

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errorInfo) setErrorInfo(null);
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrorInfo(null);
  };

  const handleCopyLink = (url, label) => {
    try {
      navigator.clipboard.writeText(url);
      if (onToast) onToast(`Link Form ${label} disalin ke clipboard!`, 'ok');
    } catch {
      if (onToast) onToast('Gagal menyalin link form.', 'err');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo(null);
    setSuccessInfo(null);

    if (!formData.job_name.trim()) {
      setErrorInfo('Nama Pekerjaan (Job Name) wajib diisi.');
      return;
    }
    if (!formData.job_no.trim()) {
      setErrorInfo('Nomor Job (No Jop) wajib diisi.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await submitWorkRequest({
        divisionKey: activeTab,
        record: formData,
        currentUser: user
      });

      if (!res.ok) {
        setErrorInfo(res.error || 'Gagal mengajukan permintaan pekerjaan.');
        if (onToast) onToast(res.error || 'Gagal mengajukan pekerjaan.', 'err');
        return;
      }

      setSuccessInfo({
        id: res.data?.id,
        job_name: res.data?.job_name,
        message: res.message
      });

      if (onToast) {
        onToast(res.message || 'Permintaan pekerjaan berhasil diajukan!', 'ok');
      }

      // Update data di local state agar langsung tampil di table & dashboard
      if (onDataMutated) {
        if (res.data) onDataMutated(activeTab, 'create', res.data);
        if (res.activeJob) onDataMutated('job_active', 'create', res.activeJob);
      }

      // Reset form
      setFormData(initialFormState);
    } catch (err) {
      console.error('[Submit Work Request Error]:', err);
      setErrorInfo(err.message || 'Terjadi kesalahan sistem saat mengajukan permintaan.');
      if (onToast) onToast('Terjadi kesalahan pengajuan.', 'err');
    } finally {
      setSubmitting(false);
    }
  };

  const getDivisionIcon = (key) => {
    switch (key) {
      case 'rec_ctcp':
        return <Printer className="w-5 h-5" />;
      case 'rec_ctp':
        return <FileText className="w-5 h-5" />;
      case 'rec_screen':
        return <Frame className="w-5 h-5" />;
      case 'rec_flexo':
        return <Package className="w-5 h-5" />;
      case 'rec_etching':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 anim-in">
      {/* Header Banner */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 via-sky-950/80 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold">
              MODUL WORK REQUEST
            </span>
            <span className="text-xs text-slate-300">&bull; Terbuka untuk Semua Pengguna</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl mt-1.5 text-white tracking-wide flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Form Permintaan Pekerjaan (Work Request)</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Ajukan permohonan pembuatan plate atau master baru ke lini Prepress. Permintaan yang diajukan langsung terdaftar dalam antrean <strong className="text-cyan-300 font-semibold">Job Aktif (ANTRI)</strong> di Dashboard Overview dan tersinkronisasi ke Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tabs 5 Lini Produksi */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {FORMS.map((f) => {
          const isActive = activeTab === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => handleTabSelect(f.key)}
              className={`flex items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-cyan-300'
              }`}
            >
              {getDivisionIcon(f.key)}
              <span>{f.title}</span>
              {f.key === 'rec_ctcp' || f.key === 'rec_ctp' ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white/90">G-Form</span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">App</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mode Switcher untuk Screen, Flexo, Etching */}
      {!isCtcpOrCtp && (
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Metode Pengajuan:
            </span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFormMode('webapp')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                  formMode === 'webapp'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Isi Langsung di Web App
              </button>
              <button
                type="button"
                onClick={() => setFormMode('google_form')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  formMode === 'google_form'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Buka Google Form</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tersinkronisasi otomatis dengan Dashboard &amp; Google Sheets</span>
          </div>
        </div>
      )}

      {/* Konten 1: Tampilan External Google Form (Wajib untuk CTCP/CTP, Opsional untuk Screen/Flexo/Etching) */}
      {(isCtcpOrCtp || formMode === 'google_form') && (
        <div className="card p-6 sm:p-8 max-w-2xl mx-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1430]/90 text-center space-y-6">
          <div
            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl"
            style={{ background: currentFormConfig.color || '#3b82f6' }}
          >
            {getDivisionIcon(currentFormConfig.key)}
          </div>

          <div>
            <span className={`badge ${currentFormConfig.bgBadge} font-mono font-bold text-xs uppercase tracking-wider mb-2 inline-block`}>
              {currentFormConfig.badge}
            </span>
            <h3 className="font-display font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              {currentFormConfig.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
              {currentFormConfig.desc}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-900/70 border border-blue-200 dark:border-slate-800 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-cyan-400">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Informasi Pengajuan:</span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-6 list-disc">
              <li>Formulir resmi Google Form digunakan untuk memproses pesanan lini {currentFormConfig.title}.</li>
              <li>Data yang Anda kirimkan melalui Google Form akan otomatis ditarik dan ditampilkan pada Dashboard PRISM.</li>
              <li>Pastikan nomor job dan spesifikasi plat diisi secara akurat.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={currentFormConfig.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full sm:w-auto py-3 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              style={{ background: currentFormConfig.color }}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Google Form Resmi</span>
            </a>
            <button
              type="button"
              onClick={() => handleCopyLink(currentFormConfig.url, currentFormConfig.label)}
              className="btn-secondary w-full sm:w-auto py-3 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>Salin Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Konten 2: Form Input Interaktif Web App (Screen, Flexo, Etching) */}
      {!isCtcpOrCtp && formMode === 'webapp' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Notifikasi Berhasil */}
          {successInfo && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 flex items-start justify-between gap-3 text-emerald-800 dark:text-emerald-300 anim-in">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Permintaan Berhasil Diajukan!</h4>
                  <p className="text-xs mt-0.5">{successInfo.message}</p>
                  <p className="text-[11px] font-mono mt-1 opacity-80">
                    ID Transaksi: <strong>{successInfo.id}</strong> | Job: {successInfo.job_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessInfo(null)}
                className="text-emerald-700 dark:text-emerald-400 hover:opacity-75 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Banner Error */}
          {errorInfo && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-600/40 flex items-start justify-between gap-3 text-rose-800 dark:text-rose-300 anim-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Gagal Mengajukan Permintaan</h4>
                  <p className="text-xs mt-0.5">{errorInfo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorInfo(null)}
                className="text-rose-700 dark:text-rose-400 hover:opacity-75 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Card Form Utama */}
          <div className="card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1430]/90 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: currentFormConfig.color }}
                >
                  {getDivisionIcon(activeTab)}
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                    Form Permintaan: {currentFormConfig.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Lengkapi rincian pengerjaan di bawah untuk memasukkan order ke antrean produksi
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="badge bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30 font-mono font-bold text-xs flex items-center gap-1.5 py-1 px-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Status: ANTRI</span>
                </span>
              </div>
            </div>

            {/* Bagian 1: Identitas & Administrasi Job */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                  1. Identitas &amp; Administrasi Job
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Permintaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="inp w-full text-xs font-medium"
                  />
                </div>

                {/* Pemohon (Requested By) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pemohon (Requested By)
                  </label>
                  <input
                    type="text"
                    placeholder="Nama staf / operator..."
                    value={formData.requested_by}
                    onChange={(e) => handleChange('requested_by', e.target.value)}
                    className="inp w-full text-xs font-medium"
                  />
                </div>

                {/* Nomor Job */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Job (No Jop) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 260321"
                    value={formData.job_no}
                    onChange={(e) => handleChange('job_no', e.target.value)}
                    className="inp w-full font-mono text-xs font-bold uppercase"
                  />
                </div>

                {/* Nomor File */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor File / Design Code
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: F-8812"
                    value={formData.file_no}
                    onChange={(e) => handleChange('file_no', e.target.value)}
                    className="inp w-full font-mono text-xs"
                  />
                </div>

                {/* Nama Pekerjaan (Lebar Penuh) */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pekerjaan (Job Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: DUS OBAT PARACETAMOL 500MG (KEMASAN BARU)"
                    value={formData.job_name}
                    onChange={(e) => handleChange('job_name', e.target.value)}
                    className="inp w-full text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Spesifikasi Teknis Khusus Divisi */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                  2. Spesifikasi Teknis ({currentFormConfig.title})
                </span>
              </div>

              {/* Form Khusus SCREEN */}
              {activeTab === 'rec_screen' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectWithCustom
                    label="Tipe Screen"
                    value={formData.screen_type}
                    onChange={(val) => handleChange('screen_type', val)}
                    options={opts.screenTypes || []}
                    placeholder="-- Pilih Tipe Screen --"
                    customPlaceholder="Ketik tipe screen manual..."
                  />
                  <SelectWithCustom
                    label="Screen Mesh (Kerapatan Kain)"
                    value={formData.screen_mesh}
                    onChange={(val) => handleChange('screen_mesh', val)}
                    options={opts.screenMeshes || []}
                    placeholder="-- Pilih Screen Mesh --"
                    customPlaceholder="Ketik mesh manual (contoh: 120T)..."
                  />
                </div>
              )}

              {/* Form Khusus FLEXO */}
              {activeTab === 'rec_flexo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SelectWithCustom
                    label="LPI (Resolusi Garis)"
                    value={formData.lpi}
                    onChange={(val) => handleChange('lpi', val)}
                    options={opts.lpis || []}
                    placeholder="-- Pilih LPI --"
                    customPlaceholder="Ketik LPI manual (contoh: 150)..."
                  />
                  <SelectWithCustom
                    label="Ketebalan Flexo (mm)"
                    value={formData.flexo_thickness}
                    onChange={(val) => handleChange('flexo_thickness', val)}
                    options={opts.flexoThicknesses || []}
                    placeholder="-- Pilih Ketebalan --"
                    customPlaceholder="Ketik tebal manual (contoh: 1.14)..."
                  />
                  <SelectWithCustom
                    label="Mesin Cetak"
                    value={formData.print_mach}
                    onChange={(val) => handleChange('print_mach', val)}
                    options={opts.printMachines || []}
                    placeholder="-- Pilih Mesin Cetak --"
                    customPlaceholder="Ketik mesin cetak manual..."
                  />
                  <SelectWithCustom
                    label="RIP POS"
                    value={formData.rip_pos}
                    onChange={(val) => handleChange('rip_pos', val)}
                    options={opts.ripPoss || []}
                    placeholder="-- Pilih RIP POS --"
                    customPlaceholder="Ketik RIP POS manual..."
                  />
                </div>
              )}

              {/* Form Khusus ETCHING */}
              {activeTab === 'rec_etching' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectWithCustom
                    label="Tipe Plate Etching"
                    value={formData.plate_type}
                    onChange={(val) => handleChange('plate_type', val)}
                    options={opts.plateTypes || []}
                    placeholder="-- Pilih Tipe Plate --"
                    customPlaceholder="Ketik tipe plate manual..."
                  />
                  <SelectWithCustom
                    label="Ketebalan Plate (mm)"
                    value={formData.plate_thickness}
                    onChange={(val) => handleChange('plate_thickness', val)}
                    options={opts.plateThicknesses || []}
                    placeholder="-- Pilih Ketebalan --"
                    customPlaceholder="Ketik tebal manual (contoh: 1.75mm)..."
                  />
                </div>
              )}
            </div>

            {/* Bagian 3: Deskripsi & Instruksi Khusus */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                  3. Deskripsi &amp; Instruksi Khusus
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi Pekerjaan / Kebutuhan Cetak
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Deskripsi pengerjaan, warna/separasi, atau instruksi posisi plate..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="inp w-full text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Tambahan (Keterangan)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Catatan prioritas, deadline, atau instruksi khusus lainnya..."
                    value={formData.keterangan}
                    onChange={(e) => {
                      handleChange('keterangan', e.target.value);
                      handleChange('notes', e.target.value);
                    }}
                    className="inp w-full text-xs resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Tombol Aksi Submit & Reset */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleReset}
                className="btn-secondary text-xs py-2.5 px-4 rounded-xl font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs py-2.5 px-6 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan &amp; Sinkronisasi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Permintaan (Ajukan Job)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
