import { Transaction } from "../types/pos";

/**
 * Fungsi untuk menembak API Cloud Server Next.js
 * Membawa data nota transaksi untuk disimpan permanen ke PostgreSQL
 */
export async function kirimTransaksiKeCloud(nota: Transaction): Promise<boolean> {
  try {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nota),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal mengirim data ke server.");
    }

    const hasil = await response.json();
    return hasil.success; // Mengembalikan nilai TRUE jika server sukses merespon
  } catch (error) {
    console.error("[Services CloudAPI Eror]:", error);
    return false; // Mengembalikan nilai FALSE jika sinyal ngadat atau server down
  }
}
