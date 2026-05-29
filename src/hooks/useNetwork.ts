import { useState, useEffect } from "react";

export function useNetwork() {
  // Set default awal ke true (Asumsi online saat pertama kali render)
  // Ini penting di Next.js untuk menghindari eror perbedaan tampilan Server vs Client (Hydration Error)
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Memastikan kode ini hanya berjalan di dalam browser client, bukan di server Next.js
    if (typeof window !== "undefined") {
      // Ambil status koneksi asli browser saat ini
      setIsOnline(navigator.onLine);

      // Fungsi pengubah status saat sinyal berubah
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      // Pasang mata-mata (Event Listener) pada sistem operasi browser
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Bersihkan mata-mata saat halaman ditutup/di-refresh agar memori laptop tidak penuh
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return isOnline;
}
