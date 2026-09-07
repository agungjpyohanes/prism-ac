Berikut adalah ringkasan perubahan (*changelog*) untuk branch **versi-7** pada proyek PRISM:

---

**1. Hak Akses & Kontrol Peran (RBAC)**

* **Restriksi Aksi Mutasi:** Tombol tambah job baru dan fasilitas edit data pekerjaan dibatasi secara ketat hanya untuk akun dengan role `prepress`, `manager`, dan `developer`.
* **Read-Only Mode:** Pengguna di luar role yang ditentukan hanya diizinkan untuk melihat (*view only*) detail data produksi.

**2. Fitur CRUD & Modal Interaktif**

* **Modal Tambah Job Baru (`CreateJobModal`):** Komponen baru untuk menambahkan antrean/data pekerjaan secara dinamis di seluruh tab lini mesin.
* **Modal Detail & Edit Langsung (`ProductionDetailModal`):** Dukungan aksi klik pada baris tabel (termasuk dari tampilan Dashboard Overview) untuk membuka rincian pekerjaan dan beralih ke mode edit.
* **Fleksibilitas Input Qty Baik:** Field *Qty Baik (Qty Good)* tidak lagi mandatory (bisa diisi `0` atau dikosongkan) guna mengakomodasi job antrean baru yang belum memiliki output jadi.

**3. Standarisasi Dropdown & Komponen Custom Input (`SelectWithCustom`)**

* **Input Khusus per Lini Mesin:**
* **Lini CTP:** Mesin expose difokuskan ke `CTP1`, mesin cetak `KBA`, dan ukuran plat `1265x1650`.
* **Lini CTCP:** Mesin expose dibatasi ke `C1`, `C2`, dan `C3`, serta opsi mesin `CD102` dihilangkan.
* **Lini Flexo:** Label mesin expose diubah menjadi `rip_pos` (RIP POS).
* **Lini Screen:** Pemetaan data tipe screen disesuaikan langsung dengan kolom database `screen_type`.


* **Fitur Ketik Manual / Lainnya:** Implementasi komponen combobox yang memungkinkan operator mengetik nilai baru jika pilihan belum ada di dropdown bawaan.
* **Dropdown Personil & Alasan:** Input teks manual untuk operator, helper/PO, penyebab rusak (*defect reason*), dan penyebab ganti (*replace reason*) distandarisasi menjadi pilihan dropdown dinamis.

**4. Pembersihan Terminologi UI**

* **Penghapusan Label Magnesium:** Menghapus dan mengganti seluruh teks kata "magnesium" pada menu, filter, dan label tab menjadi penamaan unit plat standar (*Etching Plate*).

**5. Modul Form Permintaan Pekerjaan (`WorkRequestView`)**

* **Dukungan 5 Divisi Prepress:** Modul khusus penanganan permintaan pekerjaan prepress.
* **Mode Akses Form:**
* **CTCP & CTP:** Akses formulir melalui tautan langsung Google Form.
* **Screen, Flexo, & Etching:** Tersedia pilihan pengisian formulir terintegrasi langsung di aplikasi web maupun via Google Form.



**6. Arsitektur Data & Sinkronisasi (`productionService.js` & `supabase.js`)**

* Penambahan layer service baru untuk menangani penyimpanan mutasi ke Supabase.
* Penyiapan pipeline sinkronisasi dua arah ke Google Sheets untuk menjaga konsistensi data riwayat cetak dan permintaan plat.
