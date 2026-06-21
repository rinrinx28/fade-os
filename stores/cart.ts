import { create } from "zustand";
import type { PaymentMethod, Service } from "@/lib/types/db";

export interface CartLine {
  serviceId: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  staffId: string | null;
  customerName: string;
  discount: number;
  paymentMethod: PaymentMethod;
  transferVerified: boolean;
  cashReceived: number;
  note: string;

  addService: (service: Service) => void;
  setQty: (serviceId: string, qty: number) => void;
  removeLine: (serviceId: string) => void;
  setStaff: (id: string | null) => void;
  setCustomerName: (value: string) => void;
  setDiscount: (value: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setTransferVerified: (value: boolean) => void;
  setCashReceived: (value: number) => void;
  setNote: (value: string) => void;
  clear: () => void;
}

const initial = {
  lines: [] as CartLine[],
  staffId: null as string | null,
  customerName: "",
  discount: 0,
  paymentMethod: "cash" as PaymentMethod,
  transferVerified: false,
  cashReceived: 0,
  note: "",
};

export const useCart = create<CartState>((set) => ({
  ...initial,

  addService: (service) =>
    set((state) => {
      const existing = state.lines.find((l) => l.serviceId === service.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.serviceId === service.id ? { ...l, qty: l.qty + 1 } : l,
          ),
        };
      }
      return {
        lines: [...state.lines, { serviceId: service.id, name: service.name, price: service.price, qty: 1 }],
      };
    }),

  setQty: (serviceId, qty) =>
    set((state) => ({
      lines:
        qty <= 0
          ? state.lines.filter((l) => l.serviceId !== serviceId)
          : state.lines.map((l) => (l.serviceId === serviceId ? { ...l, qty } : l)),
    })),

  removeLine: (serviceId) =>
    set((state) => ({ lines: state.lines.filter((l) => l.serviceId !== serviceId) })),

  setStaff: (staffId) => set({ staffId }),
  setCustomerName: (customerName) => set({ customerName }),
  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setTransferVerified: (transferVerified) => set({ transferVerified }),
  setCashReceived: (cashReceived) => set({ cashReceived }),
  setNote: (note) => set({ note }),
  clear: () => set({ ...initial }),
}));

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}

/** Gợi ý mệnh giá khách hay đưa: đủ tiền + làm tròn lên theo các mức thông dụng. */
export function suggestCashAmounts(total: number): number[] {
  if (total <= 0) return [];
  const set = new Set<number>([total]);
  for (const step of [10000, 20000, 50000, 100000, 200000, 500000]) {
    set.add(Math.ceil(total / step) * step);
  }
  return [...set].filter((v) => v >= total).sort((a, b) => a - b).slice(0, 5);
}
