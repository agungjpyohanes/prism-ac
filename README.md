Berikut adalah ringkasan penjelasan **README** yang ringkas, terstruktur, dan siap pakai untuk proyek **PRISM**:

---

# 📖 PRISM — Prepress Integrated System & Monitoring

**PRISM** adalah sistem dashboard web terintegrasi untuk visualisasi, analitik, dan pemantauan operasional lintas lini produksi *Prepress* secara *real-time*.

---

### 🚀 Fitur Utama

1. **Dashboard Overview (WIP & Antrean):**
* Monitoring antrean pekerjaan aktif (*In Queue*, *In Progress*, *Done*).


* Filter dinamis berdasarkan kategori divisi percetakan dan status pengerjaan.




2. **Monitoring 5 Lini Proses Prepress:**
* **CTCP Offset**, **CTP Thermal**, **Screen Printing**, **Flexography**, dan **Etching Plate**.


* Rekap otomatis *Good Output*, *Reject (Loss)*, *Replace (Ganti)*, dan *Total Output*.




3. **Analisis Mutu & Parameter Teknis:**
* Perhitungan *Loss Rate (%)* otomatis dengan batas toleransi standar target (≤ 1.0%).


* Audit parameter teknis (mesin expose, tipe plate/screen, ketebalan, dan mesin cetak).




4. **Evaluasi Tim, Shift & PO:**
* Analisis produktivitas antar shift kerja.


* Leaderboard performa Operator dan rekapan volume order per PO (Customer).




5. **Komparasi Periode & Executive View:**
* Perbandingan performa produksi antar rentang tanggal (misal: Bulan Lalu vs Bulan Ini).


* *Alert Center* untuk deteksi cepat lonjakan *reject/loss rate*.




6. **Akses Berbasis Peran (*Role-based Access*):**
* Mendukung hak akses khusus untuk *Admin*, *Manager*, *Supervisor*, *Operator*, dan *Guest*.





---

### 🛠️ Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS


* **Komponen & Visualisasi:** Chart.js, `react-chartjs-2`, Lucide React


* **Database & Integrasi:** Supabase (`@supabase/supabase-js`)



---

### 📂 Struktur Tabel Data Utama (Supabase)

* `master_user`: Data autentikasi dan role pengguna.


* `job_active`: Data antrean & progres pengerjaan aktif.


* `rec_ctcp`, `rec_ctp`, `rec_screen`, `rec_flexo`, `rec_etching`: Tabel rekaman transaksi produksi tiap lini proses.



---

### ⚡ Panduan Instalasi & Menjalankan

1. **Clone & Install Dependensi:**
```bash
git clone <repository-url>
cd performa-webapps
npm install

```


2. **Setup Variabel Lingkungan (`.env`):**
Buat file `.env` di root direktori:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

```


3. **Jalankan Aplikasi:**
```bash
npm run dev

```



*(Kredensial Demo Pengujian: `guest` / `123456`)*
