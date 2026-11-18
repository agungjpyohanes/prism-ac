import { supabase } from './supabase';
import { SHEETS } from '../constants/schema';

export const DIVISION_TO_TABLE = {
  CTP: 'rec_ctp',
  CTCP: 'rec_ctcp',
  FLEXO: 'rec_flexo',
  Flexo: 'rec_flexo',
  ETCHING: 'rec_etching',
  Etching: 'rec_etching',
  SCREEN: 'rec_screen',
  Screen: 'rec_screen'
};

export const TABLE_TO_DIVISION = {
  rec_ctp: 'CTP',
  rec_ctcp: 'CTCP',
  rec_flexo: 'Flexo',
  rec_etching: 'Etching',
  rec_screen: 'Screen'
};

/**
 * Format payload object sesuai dengan skema tabel Supabase per divisi
 */
function buildTablePayload(tableKey, formData) {
  const now = new Date();
  const dateStr = formData.date || now.toISOString().split('T')[0];
  const idStr = String(formData.id || `JOB-${Date.now()}`).trim();
  const jobName = String(formData.job_name || '').trim();
  const jobNo = String(formData.job_no || formData.id || '').trim();
  const machine = String(formData.print_mach || '').trim();
  const shift = String(formData.shift || 'SHIFT A').trim();
  const operator = String(formData.operator || '').trim();
  const good = Number(formData.qty_good) || 0;
  const defect = Number(formData.qty_defect) || 0;
  const replace = Number(formData.qty_replace) || 0;
  const defectReason = String(formData.defect_reason || '').trim();
  const replaceReason = String(formData.replace_reason || '').trim();
  const notes = String(formData.notes || '').trim();

  const base = {
    id: idStr,
    job_name: jobName,
    job_no: jobNo,
    date: dateStr,
    shift: shift,
    operator: operator,
    qty_good: good,
    qty_defect: defect,
    qty_replace: replace,
    defect_reason: defectReason,
    replace_reason: replaceReason,
    notes: notes
  };

  if (tableKey === 'rec_ctp') {
    return {
      ...base,
      expose_mach: machine || 'CTP Thermal Machine',
      print_mach: machine || 'CTP Thermal Machine',
      plate_no: jobNo,
      plate_size: formData.plate_size || 'Standar',
      paper_type: formData.paper_type || 'Standar',
      qty_new: good + defect,
      special_request: notes
    };
  }

  if (tableKey === 'rec_ctcp') {
    return {
      ...base,
      expose_mach: machine || 'UV-CTCP Expose',
      print_mach: machine || 'UV-CTCP Offset',
      plate_no: jobNo,
      plate_size: formData.plate_size || 'Standar',
      paper_type: formData.paper_type || 'Standar',
      qty_new: good + defect,
      special_request: notes,
      po_helper: formData.helper || ''
    };
  }

  if (tableKey === 'rec_flexo') {
    return {
      ...base,
      file_no: jobNo,
      status: 'FINISH',
      print_mach: machine || 'Flexo Line',
      flexo_thickness: formData.flexo_thickness || '1.14 mm',
      lpi: formData.lpi || '150',
      description: jobName,
      keterangan: notes,
      po_helper: formData.helper || ''
    };
  }

  if (tableKey === 'rec_etching') {
    return {
      ...base,
      file_no: jobNo,
      plate_type: machine || 'Etching Plate',
      plate_thickness: formData.plate_thickness || '1.75 mm',
      status: 'FINISH',
      description: jobName,
      keterangan: notes,
      po_helper: formData.helper || ''
    };
  }

  if (tableKey === 'rec_screen') {
    return {
      ...base,
      file_no: jobNo,
      screen_type: machine || 'Screen Printing',
      screen_mesh: formData.screen_mesh || '120T',
      status: 'FINISH',
      description: jobName
    };
  }

  return base;
}

/**
 * Tambah Record Produksi Baru ke Supabase
 */
export async function addProductionJob(division, formData) {
  const tableKey = DIVISION_TO_TABLE[division] || 'rec_ctcp';
  const payload = buildTablePayload(tableKey, formData);

  try {
    const { data, error } = await supabase
      .from(tableKey)
      .insert([payload])
      .select();

    if (error) {
      console.warn(`[Supabase Insert Warning] ${tableKey}:`, error.message);
      return { ok: false, error: error.message, payload };
    }

    return { ok: true, data: data?.[0] || payload };
  } catch (err) {
    console.error(`[addProductionJob Exception] ${tableKey}:`, err);
    return { ok: false, error: err.message, payload };
  }
}

/**
 * Edit / Update Record Produksi di Supabase
 */
export async function updateProductionJob(division, id, formData) {
  const tableKey = DIVISION_TO_TABLE[division] || 'rec_ctcp';
  const payload = buildTablePayload(tableKey, { ...formData, id });

  try {
    const { data, error } = await supabase
      .from(tableKey)
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      console.warn(`[Supabase Update Warning] ${tableKey}:`, error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data?.[0] || payload };
  } catch (err) {
    console.error(`[updateProductionJob Exception] ${tableKey}:`, err);
    return { ok: false, error: err.message };
  }
}

/**
 * Hapus Record Produksi dari Supabase
 */
export async function deleteProductionJob(division, id) {
  const tableKey = DIVISION_TO_TABLE[division] || 'rec_ctcp';

  try {
    const { error } = await supabase
      .from(tableKey)
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`[Supabase Delete Warning] ${tableKey}:`, error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    console.error(`[deleteProductionJob Exception] ${tableKey}:`, err);
    return { ok: false, error: err.message };
  }
}
