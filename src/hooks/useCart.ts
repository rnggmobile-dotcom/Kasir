import { useState, useEffect } from "react";
import { Product, CartItem, Transaction, TransactionItem, PaymentMethod } from "../types/pos";
import { simpanNotaOffline, ambilSemuaNotaOffline, hapusNotaOffline } from "../db/localDb";
import { useNetwork } from "./useNetwork";
import { kirimTransaksiKeCloud } from "../services/cloudApi"; // Panggil kurir asli

export function useCart(cashierId: string) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const isOnline = useNetwork();

  // =============================================================================
  // LOGIKA SINKRONISASI OTOMATIS (MENDONGKRAK NOTA OFFLINE KE CLOUD)
  // =============================================================================
  const jalankanSinkronisasi = async () => {
    if (!isOnline) return;

    try {
      // Ambil semua nota yang sempat tertahan di browser saat internet mati
      const antreanNota = await ambilSemuaNotaOffline();
      if (antreanNota.length === 0) return;

      console.log(`[Sinkronisasi] Mendeteksi ${antreanNota.length} nota offline. Memulai unggah...`);

      for (const nota of antreanNota) {
        // Tembak ke API Cloud Server asli
        const sukses = await kirimTransaksiKeCloud(nota);
        if (sukses) {
          // Jika server PostgreSQL sukses menyimpan, hapus dari laci browser
          await hapusNotaOffline(nota.id);
        }
      }
      console.log("[Sinkronisasi] Semua nota offline berhasil disinkronkan ke Cloud!");
    } catch (error) {
      console.error("[Sinkronisasi] Gagal mengeksekusi sinkronisasi otomatis:", error);
    }
  };

  // Efek Otomatis: Setiap kali sinyal internet berubah menjadi ONLINE, langsung sedot antrean
  useEffect(() => {
    if (isOnline) {
      jalankanSinkronisasi();
    }
  }, [isOnline]);

  // =============================================================================
  // LOGIKA KENDALI ITEM & MATEMATIKA (Tetap sama seperti kemarin)
  // =============================================================================
  const addToCart = (product: Product) => {
    if (!product.isActive || product.stock <= 0) return;
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, amount: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.11);
  const discountAmount = 0;
  const grandTotal = subtotal - discountAmount + taxAmount;

  // =============================================================================
  // PROSES CHECKOUT ASLI (ASYNCHRONOUS)
  // =============================================================================
  const checkout = async (
    paymentMethod: PaymentMethod, 
    amountPaid: number
  ): Promise<{ success: boolean; message: string }> => {
    
    if (cart.length === 0) return { success: false, message: "Keranjang masih kosong!" };
    if (amountPaid < grandTotal) return { success: false, message: "Uang pembayaran kurang!" };

    const items: TransactionItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      qty: item.quantity,
      priceAtSale: item.product.price,
      totalItemPrice: item.product.price * item.quantity,
    }));

    const notaBaru: Transaction = {
      id: crypto.randomUUID(),
      cashierId,
      memberId: null,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      paymentMethod,
      amountPaid,
      amountReturn: amountPaid - grandTotal,
      timestamp: Date.now(),
      status: isOnline ? "synced" : "pending_sync",
    };

    try {
      if (isOnline) {
        // TEMBAK ASLI KE SERVER CLOUD
        const berhasilKeCloud = await kirimTransaksiKeCloud(notaBaru);
        
        if (berhasilKeCloud) {
          clearCart();
          return { success: true, message: "Transaksi sukses dan langsung tersimpan aman di Cloud PostgreSQL!" };
        } else {
          // BACKUP SAFETY: Jika server cloud tiba-tiba down/gagal padahal sinyal ada, amankan ke lokal!
          await simpanNotaOffline({ ...notaBaru, status: "pending_sync" });
          clearCart();
          return { success: true, message: "Cloud Server sedang sibuk. Nota diamankan ke laci browser untuk antrean." };
        }
      } else {
        // JALUR OFFLINE MURNI
        await simpanNotaOffline(notaBaru);
        clearCart();
        return { success: true, message: "Sinyal internet putus! Nota berhasil diamankan di laci lokal browser HP/Laptop Anda." };
      }
    } catch (error) {
      console.error("Gagal mengeksekusi transaksi:", error);
      return { success: false, message: "Eror kritis gagal memproses nota belanja." };
    }
  };

  return {
    cart,
    addToCart,
    updateQuantity,
    clearCart,
    subtotal,
    taxAmount,
    grandTotal,
    checkout,
    paksaSinkronisasi: jalankanSinkronisasi // Diekspor agar bisa dipicu tombol manual jika mau
  };
}
