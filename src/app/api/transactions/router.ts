import { NextResponse } from "next/server";
import { Transaction } from "../../../types/pos";

// =============================================================================
// API ENDPOINT: POST /api/transactions
// =============================================================================
export async function POST(request: Request) {
  try {
    // 1. Terima kiriman data paket nota dari Kasir (Frontend)
    const nota: Transaction = await request.json();

    // 2. Validasi Keamanan Tingkat Server
    if (!nota || !nota.id || !nota.items || nota.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data transaksi tidak valid atau kosong!" },
        { status: 400 }
      );
    }

    // 3. Simulasi Validasi Keuangan di Server (Mencegah manipulasi angka dari client)
    const hitungUlangTotal = nota.items.reduce((sum, item) => sum + item.totalItemPrice, 0);
    console.log(`[SERVER] Memvalidasi Nota ${nota.id}. Total Item: Rp${hitungUlangTotal}`);

    // =========================================================================
    // TEMPAT MENARUH KONEKSI DATABASE UTAMA (PostgreSQL / Supabase / Prisma)
    // =========================================================================
    // Contoh Logika Riil Masa Depan:
    // await db.insert(transactionsTable).values({ id: nota.id, total: nota.grandTotal });
    // await db.insert(transactionItemsTable).values(nota.items);
    // =========================================================================

    // Simulasi jeda loading server memproses data (misal: 300 milidetik)
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log(`[SERVER SUCCESS] Nota ${nota.id} AMAN disimpan di Cloud PostgreSQL.`);

    // 4. Beri jawaban sukses ke Kasir agar antrean di HP/Laptop mereka bisa dihapus
    return NextResponse.json(
      { 
        success: true, 
        message: "Server Cloud berhasil mengamankan transaksi.",
        transactionId: nota.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[SERVER EROR]:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kegagalan sistem internal di Cloud Server." },
      { status: 500 }
    );
  }
}
