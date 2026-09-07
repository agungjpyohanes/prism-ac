import { cell } from '../utils/formatters.js';
import { SHEETS } from './schema.js';

// Nilai standar dasar per lini produksi
export const BASE_MACHINE_SPECS = {
  rec_ctcp: {
    exposeMachines: ['C1', 'C2', 'C3'],
    printMachines: ['K5', 'K6', 'K7', 'K8', 'K9', 'K10', 'K11', 'K12', 'K13', 'K14', 'K15', 'K16', 'K17', 'K18', 'K19', 'K20', 'K21', 'K22', 'GTO', 'R700', 'SM52', 'ZP10', 'ZP11', 'ZP12', 'ZP13'],
    plateSizes: ['510', '650', '745', '760', '790', '800', '900', '1030', 'UV 800'],
    paperTypes: ['WHITE KRAFT', 'BROWN KRAFT', 'DUPLEX', 'IVORY', 'HVS', 'ATP', 'ART CARTON', 'ART PAPER', 'QPP', 'NEW SNOW BROCADE', 'GREYBOARD'],
    defectReasons: [
      'PLATE NYANGKUT',
      'PLATE CACAT',
      'SCRATCH / GORES',
      'BURAM / BINTIK',
      'OVER EXPOSURE',
      'UNDER EXPOSURE',
      'SALAH UKURAN',
      'SALAH SUDUT SCREEN',
      'KIMIA BASAH JELEK',
      'LASER EROR'
    ],
    replaceReasons: [
      'AUS < 50 RIBU',
      'AUS 50 - 100 RIBU',
      'AUS > 100 RIBU',
      'BERCAK / BINTIK',
      'BLARUT',
      'RUSAK DI MESIN CETAK',
      'REVISI DESAIN / FILE',
      'PLATE HILANG',
      'SALAH TEKSTUR'
    ]
  },
  rec_ctp: {
    exposeMachines: ['CTP1'],
    printMachines: ['KBA'],
    plateSizes: ['1265x1650'],
    paperTypes: ['IVORY', 'DUPLEX', 'ATP', 'WHITE KRAFT', 'ART CARTON', 'ART PAPER', 'HVS'],
    defectReasons: [
      'PLATE CACAT',
      'PLATE NYANGKUT',
      'LISTRIK MATI',
      'PLATE BLARUT',
      'LASER EROR',
      'SCRATCH / GORES',
      'DEBU / BINTIK',
      'FOCUS LASER TIDAK TEPAT'
    ],
    replaceReasons: [
      'AUS < 50 RIBU',
      'AUS 50 - 100 RIBU',
      'AUS > 100 RIBU',
      'BLARUT',
      'NGEFLEX',
      'NGGALER',
      'RUSAK DI MESIN CETAK',
      'REVISI TEKS / FILE',
      'PLATE BENGKOK'
    ]
  },
  rec_screen: {
    exposeMachines: ['Exposure Manual', 'Exposure Unit 1', 'Exposure Unit 2'],
    printMachines: ['Sablon Otomatis', 'Sablon Semi-Auto', 'Sablon Manual', 'Rotary'],
    screenTypes: [
      'COLD FOIL',
      'GLITER LEM',
      'GLITTER CAMPUR',
      'GLITTER MANUAL',
      'GLITTER TABUR',
      'SEMI MANUAL',
      'SPOT',
      'SPOT MANUAL',
      'SPUNBOND',
      'SPUNBOND MANUAL'
    ],
    screenMeshes: ['T77', 'T90', 'T100', 'T120', 'T140', 'T150', 'T165'],
    paperTypes: ['KAIN KAOS', 'MIKA / PLASTIK', 'KERTAS ART', 'STICKER', 'KRAFT'],
    defectReasons: [
      'KAIN SCREEN JEBOL',
      'AFDRUK BOCOR',
      'OVER EXPOSURE',
      'UNDER EXPOSURE',
      'MAMPET / BINTIK',
      'TINTA KERING',
      'FILM BURAM',
      'REGISTER MELOROT'
    ],
    replaceReasons: [
      'KAIN SOBEK / KENDOR',
      'AFDRUK RONTOK SAAT CETAK',
      'GANTI WARNA / DESAIN',
      'REVISI FILM DARI KONSUMEN',
      'KEMATIAN KAIN'
    ]
  },
  rec_flexo: {
    exposeMachines: ['CDI Spark', 'Main Expose 1', 'Main Expose 2', 'Back Expose'],
    printMachines: ['EKOFA', 'MARK ANDY', 'NILPETER', 'GALLUS', 'LOMBARDI'],
    flexoThicknesses: ['1.14 mm', '1.70 mm', '2.54 mm', '2.84 mm'],
    lpis: ['100 LPI', '120 LPI', '133 LPI', '150 LPI', '175 LPI'],
    paperTypes: ['STICKER CHROME', 'STICKER VINYL', 'CORRUGATED', 'FILM OPP', 'KRAFT'],
    defectReasons: [
      'TITIK HILANG (WASH OUT)',
      'PLATE LENGKET',
      'TEBAL TIDAK RATA',
      'OVER EXPOSE BACK',
      'OVER EXPOSE MAIN',
      'CACAT LASER CDI',
      'CRACK / PECAH',
      'REVISI LAYOUT'
    ],
    replaceReasons: [
      'PLATE SOBEK DI MESIN CETAK',
      'AUS TINGGI',
      'GANTI CYLINDER',
      'REVISI DESIGN KONSUMEN',
      'SOLVENT RUSAK'
    ]
  },
  rec_etching: {
    exposeMachines: ['Unit Exposure Etch', 'Unit Etching 1', 'Unit Etching 2'],
    printMachines: ['Hot Stamping 1', 'Hot Stamping 2', 'Emboss Press 1', 'Emboss Press 2'],
    plateTypes: ['ETCHING PLATE', 'ZINC ETCH', 'COPPER ETCH', 'BRASS ETCH'],
    plateThicknesses: ['1.0 mm', '1.75 mm', '2.0 mm', '3.0 mm'],
    paperTypes: ['KERTAS IVORY', 'DUPLEX', 'ART CARTON', 'HARD COVER', 'KULIT SINTETIS'],
    defectReasons: [
      'ETCHING TERLALU DALAM',
      'DETAIL RONTOK',
      'ACID OVERCOOK',
      'BASE CORROSION',
      'FILM GESER',
      'REVISI EMBOSS / FOIL',
      'PERMUKAAN KASAR'
    ],
    replaceReasons: [
      'PLATE EMBOSS PENYOK',
      'BLOK FOIL MENIPIS',
      'REVISI EMBOSS / LOGO',
      'PATAH TEKANAN MESIN'
    ]
  }
};

export const COMMON_STATUSES = [
  'ANTRI',
  'PROSES',
  'SELESAI',
  'WASHING',
  'MAIN EXPOSE',
  'HDI',
  'TUNGGU INFO',
  'TUNGGU FILE',
  'HOLD'
];

export const JOP_CATEGORIES = [
  'OFFSET',
  'CTP',
  'SCREEN',
  'FLEXO',
  'ETCHING',
  'SAMPLE',
  'REPRINT'
];

/**
 * Mengambil opsi dropdown secara dinamis dan context-aware per lini mesin
 */
export function getDropdownOptions(tableKey = 'rec_ctcp', data = {}) {
  const base = BASE_MACHINE_SPECS[tableKey] || BASE_MACHINE_SPECS.rec_ctcp;
  const cfg = SHEETS[tableKey] || SHEETS.rec_ctcp;
  const rows = data[tableKey] || [];

  // 1. Operator List (Master Personil + History Table)
  const operatorSet = new Set();
  (data.rec_personil || []).forEach((p) => {
    const name = p.nama_lengkap || p.nick_name;
    if (name && name !== '-') operatorSet.add(name.trim());
  });
  if (cfg.i?.operator != null && cfg.i.operator !== -1) {
    rows.forEach((r) => {
      const v = cell(r, cfg.i.operator, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') operatorSet.add(v);
    });
  }

  // 2. PO / Helper List (Master Personil PO + History Table)
  const helperSet = new Set();
  (data.rec_personil || []).forEach((p) => {
    const jab = String(p.jabatan || '').toUpperCase();
    if (jab.includes('PO') || jab.includes('HELPER')) {
      const name = p.nama_lengkap || p.nick_name;
      if (name && name !== '-') helperSet.add(name.trim());
    }
  });
  // Tambahkan juga personil umum jika PO spesifik masih sedikit
  if (helperSet.size < 3) {
    (data.rec_personil || []).forEach((p) => {
      const name = p.nama_lengkap || p.nick_name;
      if (name && name !== '-') helperSet.add(name.trim());
    });
  }
  if (cfg.i?.po_helper != null && cfg.i.po_helper !== -1) {
    rows.forEach((r) => {
      const v = cell(r, cfg.i.po_helper, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') helperSet.add(v);
    });
  }

  // 3. Mesin Expose
  let exposeList = [];
  if (tableKey === 'rec_ctp') {
    // Lini CTP: nilai unik expose_mach khusus CTP, default HANYA "CTP1" jika list database kosong
    const ctpRows = data.rec_ctp || (tableKey === 'rec_ctp' ? rows : []);
    const ctpExposeSet = new Set();
    const ctpCfg = SHEETS.rec_ctp;
    ctpRows.forEach((r) => {
      const v = cell(r, ctpCfg.i?.expose_mach, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') ctpExposeSet.add(v);
    });
    if (ctpExposeSet.size === 0) ctpExposeSet.add('CTP1');
    exposeList = Array.from(ctpExposeSet).sort();
  } else if (tableKey === 'rec_ctcp') {
    // Lini CTCP: nilai unik expose_mach khusus CTCP, whitelist HANYA "C1", "C2", dan "C3"
    const CTCP_EXPOSE_WHITELIST = new Set(['C1', 'C2', 'C3']);
    const ctcpRows = data.rec_ctcp || (tableKey === 'rec_ctcp' ? rows : []);
    const ctcpExposeSet = new Set();
    const ctcpCfg = SHEETS.rec_ctcp;
    ctcpRows.forEach((r) => {
      const v = cell(r, ctcpCfg.i?.expose_mach, '').trim().toUpperCase();
      if (CTCP_EXPOSE_WHITELIST.has(v)) {
        ctcpExposeSet.add(v);
      }
    });
    if (ctcpExposeSet.size === 0) {
      ['C1', 'C2', 'C3'].forEach((x) => ctcpExposeSet.add(x));
    }
    exposeList = Array.from(ctcpExposeSet).sort();
  } else {
    // Lini lainnya (Screen, Flexo, Etching)
    const exposeSet = new Set(base.exposeMachines || []);
    if (cfg.i?.expose_mach != null && cfg.i.expose_mach !== -1) {
      rows.forEach((r) => {
        const v = cell(r, cfg.i.expose_mach, '').trim();
        if (v && v !== '-' && v.toUpperCase() !== 'NULL') exposeSet.add(v);
      });
    }
    exposeList = Array.from(exposeSet).sort();
  }

  // 4. Mesin Cetak
  let printList = [];
  if (tableKey === 'rec_ctp') {
    // Lini CTP: nilai unik print_mach khusus CTP, default HANYA "KBA" jika list database kosong
    const ctpRows = data.rec_ctp || (tableKey === 'rec_ctp' ? rows : []);
    const ctpPrintSet = new Set();
    const ctpCfg = SHEETS.rec_ctp;
    ctpRows.forEach((r) => {
      const v = cell(r, ctpCfg.i?.print_mach, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') ctpPrintSet.add(v);
    });
    if (ctpPrintSet.size === 0) ctpPrintSet.add('KBA');
    printList = Array.from(ctpPrintSet).sort();
  } else if (tableKey === 'rec_ctcp') {
    // Lini CTCP: nilai unik print_mach khusus CTCP, blacklist: hapus/kecualikan "CD102"
    const CTCP_PRINT_BLACKLIST = new Set(['CD102']);
    const ctcpRows = data.rec_ctcp || (tableKey === 'rec_ctcp' ? rows : []);
    const ctcpPrintSet = new Set();
    (base.printMachines || []).forEach((m) => {
      if (!CTCP_PRINT_BLACKLIST.has(m.toUpperCase())) ctcpPrintSet.add(m);
    });
    const ctcpCfg = SHEETS.rec_ctcp;
    ctcpRows.forEach((r) => {
      const v = cell(r, ctcpCfg.i?.print_mach, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL' && !CTCP_PRINT_BLACKLIST.has(v.toUpperCase())) {
        ctcpPrintSet.add(v);
      }
    });
    printList = Array.from(ctcpPrintSet).sort();
  } else {
    // Lini lainnya
    const printSet = new Set(base.printMachines || []);
    if (cfg.i?.print_mach != null && cfg.i.print_mach !== -1) {
      rows.forEach((r) => {
        const v = cell(r, cfg.i.print_mach, '').trim();
        if (v && v !== '-' && v.toUpperCase() !== 'NULL') printSet.add(v);
      });
    }
    printList = Array.from(printSet).sort();
  }

  // 5. Ukuran Plate
  let sizeList = [];
  if (tableKey === 'rec_ctp') {
    // Lini CTP: nilai unik plate_size khusus CTP, default HANYA "1265x1650" jika list database kosong
    const ctpRows = data.rec_ctp || (tableKey === 'rec_ctp' ? rows : []);
    const ctpSizeSet = new Set();
    const ctpCfg = SHEETS.rec_ctp;
    ctpRows.forEach((r) => {
      const v = cell(r, ctpCfg.i?.plate_size, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') ctpSizeSet.add(v);
    });
    if (ctpSizeSet.size === 0) ctpSizeSet.add('1265x1650');
    sizeList = Array.from(ctpSizeSet).sort();
  } else {
    // Lini lainnya
    const sizeSet = new Set(base.plateSizes || []);
    if (cfg.i?.plate_size != null && cfg.i.plate_size !== -1) {
      rows.forEach((r) => {
        const v = cell(r, cfg.i.plate_size, '').trim();
        if (v && v !== '-' && v.toUpperCase() !== 'NULL') sizeSet.add(v);
      });
    }
    sizeList = Array.from(sizeSet).sort();
  }

  // 6. Jenis Kertas / Substrat
  const paperSet = new Set(base.paperTypes || []);
  if (cfg.i?.paper_type != null && cfg.i.paper_type !== -1) {
    rows.forEach((r) => {
      const v = cell(r, cfg.i.paper_type, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') paperSet.add(v);
    });
  }

  // 7. Tipe Screen (Screen Printing) - Query distinct nilai kolom screen_type dari database
  const screenRows = data.rec_screen || (tableKey === 'rec_screen' ? rows : []);
  const screenTypeSet = new Set();
  const screenCfg = SHEETS.rec_screen;
  if (screenCfg?.i?.screen_type != null && screenCfg.i.screen_type !== -1) {
    screenRows.forEach((r) => {
      const v = cell(r, screenCfg.i.screen_type, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') {
        screenTypeSet.add(v);
      }
    });
  }
  if (screenTypeSet.size === 0 && base.screenTypes) {
    base.screenTypes.forEach((t) => screenTypeSet.add(t));
  }
  const screenTypeList = Array.from(screenTypeSet).sort();

  // 8. Alasan Defect / Rusak (Context-Aware per lini)
  const defectSet = new Set(base.defectReasons || []);
  const defectCol = cfg.i?.penyRusak ?? cfg.i?.defect_reason;
  if (defectCol != null && defectCol !== -1) {
    rows.forEach((r) => {
      const v = cell(r, defectCol, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') defectSet.add(v);
    });
  }

  // 9. Alasan Ganti / Reprint (Context-Aware per lini)
  const replaceSet = new Set(base.replaceReasons || []);
  const replaceCol = cfg.i?.penyGanti ?? cfg.i?.replace_reason;
  if (replaceCol != null && replaceCol !== -1) {
    rows.forEach((r) => {
      const v = cell(r, replaceCol, '').trim();
      if (v && v !== '-' && v.toUpperCase() !== 'NULL') replaceSet.add(v);
    });
  }

  // 10. Permintaan Khusus / Special Request (CTCP & CTP)
  const specialReqSet = new Set([
    'JOP PEDOTAN',
    'FILE MAS DIDIK',
    'PINDAH MESIN',
    'BLOCK DOUBLE',
    'TAMBAHAN',
    'REVISI FILE',
    'DOUBLE JATAH 50 RB',
    'SISA',
    'FILE WAHYUDI'
  ]);
  const reqRows = [...(data.rec_ctcp || []), ...(data.rec_ctp || [])];
  reqRows.forEach((r) => {
    const v = (cell(r, 14, '') || '').trim();
    if (v && v !== '-' && v.toUpperCase() !== 'NULL') specialReqSet.add(v);
  });

  // 11. RIP POS (Khusus Lini Flexo)
  const ripPosSet = new Set(['CDI SPARK', 'HD FLEXO', 'ESKO RIP', 'KODAK TIFF', 'MAIN EXPOSE']);
  (data.rec_flexo || []).forEach((r) => {
    const v = (cell(r, 13, '') || '').trim();
    if (v && v !== '-' && v.toUpperCase() !== 'NULL') ripPosSet.add(v);
  });

  // 12. Status & Kategori (khusus job_active atau tabel umum)
  const statusSet = new Set(COMMON_STATUSES);
  (data.job_active || []).forEach((r) => {
    const v = cell(r, 4, '').trim();
    if (v && v !== '-' && v.toUpperCase() !== 'NULL') statusSet.add(v);
  });

  const catSet = new Set(JOP_CATEGORIES);
  (data.job_active || []).forEach((r) => {
    const v = cell(r, 7, '').trim();
    if (v && v !== '-' && v.toUpperCase() !== 'NULL') catSet.add(v.toUpperCase());
  });

  return {
    operators: Array.from(operatorSet).sort(),
    helpers: Array.from(helperSet).sort(),
    exposeMachines: exposeList,
    printMachines: printList,
    plateSizes: sizeList,
    paperTypes: Array.from(paperSet).sort(),
    screenTypes: screenTypeList,
    screenMeshes: base.screenMeshes || [],
    flexoThicknesses: base.flexoThicknesses || [],
    lpis: base.lpis || [],
    plateTypes: base.plateTypes || [],
    plateThicknesses: base.plateThicknesses || [],
    ripPoss: Array.from(ripPosSet).sort(),
    specialRequests: Array.from(specialReqSet).sort(),
    defectReasons: Array.from(defectSet).sort(),
    replaceReasons: Array.from(replaceSet).sort(),
    statuses: Array.from(statusSet).sort(),
    categories: Array.from(catSet).sort()
  };
}
