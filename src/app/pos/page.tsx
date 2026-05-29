"use client";

import React, { useState, useEffect } from "react";
import { Product, PaymentMethod } from "../../types/pos";
import { useCart } from "../../hooks/useCart";
import { useNetwork } from "../../hooks/useNetwork";
import { hitungAntreanNota } from "../../db/localDb";

// Master Data Produk Dummy Sesuai Cetak Biru (Types)
const DATA_PRODUK_MASTER: Product[] = [
  { id: "prod-1", sku: "89912345", name: "Kopi Susu Gula Aren", price: 18000, costPrice: 9000, stock: 50, category: "Minuman", isActive: true },
  { id: "prod-2", sku: "89954321", name: "Croissant Almond", price: 25000, costPrice: 13000, stock: 12, category: "Makanan", isActive: true },
  { id: "prod-3", sku: "89967890", name: "Es Teh Manis", price: 6000, costPrice: 1500, stock: 100, category: "Minuman", isActive: true },
  { id: "prod-4", sku: "89909876", name: "Kentang Goreng (Fries)", price: 15000, costPrice: 7000, stock: 0, category: "Snack", isActive: true },
];

export default function PosUtamaPage() {
  // 1. Panggil Semua Sensor Pintar & Otak Hitung yang Sudah Kita Buat
  const ID_KASIR_AKTIF = "KSR-BUDHY-01";
  const isOnline = useNetwork();
  const {
    cart,
    addToCart,
    updateQuantity,
    subtotal,
    taxAmount,
    grandTotal,
    checkout,
  } = useCart(ID_KASIR_AKTIF);

  // 2. State Khusus untuk Kendali Tampilan Layar
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [queueCount, setQueueCount] = useState(0);
  
  // State Input Pembayaran
  const [metodeBayar, setMetodeBayar] = useState<PaymentMethod>("TUNAI");
  const [nominalUangDiterima, setNominalUangDiterima] = useState<number>(0);

  // 3. Efek Otomatis untuk Memantau Isi Brankas Lokal Browser
  const perbaruiAngkaAntrean = async () => {
    const jumlah = await hitungAntreanNota();
    setQueueCount(jumlah);
  };

  useEffect(() => {
    perbaruiAngkaAntrean();
    // Jika status internet berubah (misal dari offline ke online), cek antrean lagi
  }, [isOnline, cart]);

  // 4. Fungsi Eksekusi saat Tombol Bayar Ditekan
  const eksekusiPembayaran = async () => {
    // Jalankan logika checkout dari useCart
    const hasil = await checkout(metodeBayar, nominalUangDiterima);
    
    alert(hasil.message);
    
    if (hasil.success) {
      // Reset input pembayaran jika transaksi berhasil
      setNominalUangDiterima(0);
      perbaruiAngkaAntrean();
    }
  };

  // Filter Produk Berdasarkan Kategori & Kotak Pencarian
  const produkTerfilter = DATA_PRODUK_MASTER.filter((produk) => {
    const cocokKategori = selectedCategory === "Semua" || produk.category === selectedCategory;
    const cocokNamaAtauSku = 
      produk.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      produk.sku.includes(searchQuery);
    return cocokKategori && cocokNamaAtauSku && produk.isActive;
  });

  return (
    <div className="grid grid-cols-12 h-screen w-screen overflow-hidden font-sans bg-slate-100 text-slate-800 select-none">
      
      {/* =======================================================================
          KOLOM KIRI: KATALOG PRODUK (8 KOLOM)
          ======================================================================= */}
      <div className="col-span-8 flex flex-col p-6 overflow-y-auto h-full">
        
        {/* HEADER BARIS UTAMA */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">CetakStruk POS</h1>
            <p className="text-xs text-slate-500 font-medium">Operator Aktif: <span className="font-bold text-slate-700">Budhy Gunawan</span></p>
          </div>
          
          {/* BADGE LAMPU INDIKATOR STATUS JARINGAN */}
          <div className="flex items-center gap-3">
            {queueCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-black px-3 py-1.5 rounded-xl animate-pulse shadow-sm">
                {queueCount} Nota Tertahan di Browser
              </span>
            )}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider shadow-sm border ${
              isOnline 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`}></span>
              {isOnline ? "MODE CLOUD (ONLINE)" : "MODE LOKAL (OFFLINE)"}
            </div>
          </div>
        </div>

        {/* INPUT PENCARIAN UTAMA */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Ketik nama menu makanan/minuman atau langsung scan barcode di sini..."
            className="w-full p-4 border border-slate-200 rounded-2xl bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium placeholder-slate-400 text-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* TABS KATEGORI */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {["Semua", "Makanan", "Minuman", "Snack"].map((kategori) => (
            <button
              key={kategori}
              onClick={() => setSelectedCategory(kategori)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide border transition-all cursor-pointer ${
                selectedCategory === kategori
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {kategori.toUpperCase()}
            </button>
          ))}
        </div>

        {/* GRID KARTU PRODUK */}
        <div className="grid grid-cols-3 gap-4">
          {produkTerfilter.map((produk) => {
            const isHabis = produk.stock <= 0;
            return (
              <div
                key={produk.id}
                onClick={() => !isHabis && addToCart(produk)}
                className={`bg-white p-4 rounded-2xl border transition-all flex flex-col justify-between h-40 ${
                  isHabis
                    ? "opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed"
                    : "border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-500 cursor-pointer active:scale-95"
                }`}
              >
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{produk.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">SKU: {produk.sku}</p>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-emerald-600 font-black text-base">Rp {produk.price.toLocaleString("id-ID")}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${isHabis ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
                    {isHabis ? "HABIS" : `Stok: ${produk.stock}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =======================================================================
          KOLOM KANAN: PANEL KERANJANG & TRANSAKSI (4 KOLOM)
          ======================================================================= -->
      <div className="col-span-4 flex flex-col bg-white border-l border-slate-200 shadow-2xl h-full justify-between">
        
        {/* PANEL ATAS KEPALA KERANJANG */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Item Di Keranjang</span>
          <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{cart.length} Jenis</span>
        </div>

        {/* PANEL TENGAH: DAFTAR BARANG YANG AKAN DIBELI */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 text-center">
              <p className="text-xs font-bold">Belum Ada Pesanan</p>
              <p className="text-[11px] text-slate-400 mt-1">Klik pada menu di sebelah kiri untuk menambahkan barang</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex-1 pr-2">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">@Rp {item.product.price.toLocaleString("id-ID")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md flex items-center justify-center font-black text-xs cursor-pointer">-</button>
                  <span className="text-xs font-bold w-5 text-center text-slate-800">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md flex items-center justify-center font-black text-xs cursor-pointer">+</button>
                </div>
                <span className="text-xs font-black text-slate-700 ml-3 w-20 text-right">
                  Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                </span>
              </div>
            ))
          )}
        </div>

        {/* PANEL BAWAH: METODE BAYAR & HITUNGAN KEUANGAN */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
          
          {/* PILIHAN METODE PEMBAYARAN */}
          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase tracking-wider">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              {(["TUNAI", "QRIS"] as PaymentMethod[]).map((metode) => (
                <button
                  key={metode}
                  onClick={() => setMetodeBayar(metode)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    metodeBayar === metode
                      ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {metode}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT UANG TUNAI DITERIMA */}
          {metodeBayar === "TUNAI" && (
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-wider">Uang Tunai Diterima (Rp)</label>
              <input
                type="number"
                placeholder="Contoh: 50000"
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-slate-500"
                value={nominalUangDiterima || ""}
                onChange={(e) => setNominalUangDiterima(Number(e.target.value))}
              />
            </div>
          )}

          {/* NOTA RINGKASAN STRUK AKHIR */}
          <div className="space-y-1.5 text-xs border-b border-slate-200 pb-3 font-medium text-slate-500">
            <div className="flex justify-between"><span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span></div>
            <div className="flex justify-between"><span>PPN (11%)</span><span>Rp {taxAmount.toLocaleString("id-ID")}</span></div>
            
            {metodeBayar === "TUNAI" && nominalUangDiterima >= grandTotal && (
              <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md mt-1 text-[11px]">
                <span>Kembalian Kasir</span>
                <span>Rp {(nominalUangDiterima - grandTotal).toLocaleString("id-ID")}</span>
              </div>
            )}
          </div>

          {/* TOTAL AKHIR BESAR */}
          <div className="flex justify-between items-center py-0.5">
            <span className="font-black text-slate-700 text-sm uppercase tracking-wide">Total Tagihan</span>
            <span className="text-xl font-black text-emerald-700">Rp {grandTotal.toLocaleString("id-ID")}</span>
          </div>

          {/* TOMBOL UTAMA CHEKOUT */}
          <button
            onClick={eksekusiPembayaran}
            disabled={cart.length === 0 || (metodeBayar === "TUNAI" && nominalUangDiterima < grandTotal)}
            className={`w-full py-4 text-center rounded-xl font-black text-white text-sm transition-all shadow-md ${
              cart.length > 0 && (metodeBayar !== "TUNAI" || nominalUangDiterima >= grandTotal)
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 cursor-pointer active:scale-98"
                : "bg-slate-300 shadow-none cursor-not-allowed"
            }`}
          >
            PROSES TRANSAKSI
          </button>
        </div>

      </div>
    </div>
  );
}
