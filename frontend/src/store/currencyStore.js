import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      // Tasa de cambio: 1 USD = X Bs
      exchangeRate: 95.0,
      // Moneda activa para visualización
      displayCurrency: "USD",

      setExchangeRate: (rate) => {
        const parsed = parseFloat(rate);
        if (!isNaN(parsed) && parsed > 0) {
          set({ exchangeRate: parsed });
        }
      },

      setDisplayCurrency: (currency) => set({ displayCurrency: currency }),

      // Helper: convertir USD a Bs
      toBs: (usdAmount) => {
        const rate = get().exchangeRate;
        return Number((usdAmount * rate).toFixed(2));
      },

      // Helper: formatear en ambas monedas
      formatDual: (usdAmount) => {
        const rate = get().exchangeRate;
        const bs = Number((usdAmount * rate).toFixed(2));
        return { usd: Number(usdAmount).toFixed(2), bs: bs.toFixed(2) };
      },
    }),
    {
      name: "currency-store",
    }
  )
);
