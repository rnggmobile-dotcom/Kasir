import { Transaction } from "../types/pos";

const DB_NAME = "CetakStruk_POS_DB";
const DB_VERSION = 1;
const STORE_NAME = "nota_queue";

// =============================================================================
// FUNCTION 1: INISIALISASI & BUKA DATABASE
// =============================================================================
// Fungsi internal untuk membuka koneksi ke IndexedDB di dalam browser
const bukaDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Terpicu jika database pertama kali dibuat atau versi naik
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Membuat "Tabel" bernama 'nota_queue' dengan 'id' sebagai kunci utama (Primary Key)
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// =============================================================================
// FUNCTION 2: SIMPAN NOTA SECARA OFFLINE (WRITE)
// =============================================================================
export const simpanNotaOffline = async (nota: Transaction): Promise<void> => {
  const db = await bukaDB();
  return new Promise((resolve, reject) => {
    // Membuka transaksi dengan mode 'readwrite' (bisa menulis data)
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.add(nota);

    request.onsuccess = () => {
      console.log(`[Brankas Lokal] Nota ${nota.id} berhasil diamankan di browser.`);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

// =============================================================================
// FUNCTION 3: AMBIL SEMUA ANTREAN NOTA OFFLINE (READ)
// =============================================================================
export const ambilSemuaNotaOffline = async (): Promise<Transaction[]> => {
  const db = await bukaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// =============================================================================
// FUNCTION 4: HAPUS NOTA DARI ANTREAN (DELETE)
// =============================================================================
// Digunakan setelah nota offline berhasil terupload ke Cloud Server (PostgreSQL)
export const hapusNotaOffline = async (id: string): Promise<void> => {
  const db = await bukaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`[Brankas Lokal] Nota ${id} dibersihkan karena sudah singkron ke Cloud.`);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

// =============================================================================
// FUNCTION 5: HITUNG JUMLAH ANTREAN NOTA
// =============================================================================
// Digunakan untuk menampilkan angka notifikasi "X Nota Offline Antre" di layar kasir
export const hitungAntreanNota = async (): Promise<number> => {
  const db = await bukaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
