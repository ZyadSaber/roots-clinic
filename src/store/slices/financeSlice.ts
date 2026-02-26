import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FinanceState {
  pendingInvoiceItems: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  currency: string;
  taxRate: number;
}

const initialState: FinanceState = {
  pendingInvoiceItems: [],
  currency: "EGP",
  taxRate: 14, // 14% VAT as default for Egypt
};

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    addToInvoice: (
      state,
      action: PayloadAction<FinanceState["pendingInvoiceItems"][0]>,
    ) => {
      const existing = state.pendingInvoiceItems.find(
        (item) => item.id === action.payload.id,
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.pendingInvoiceItems.push(action.payload);
      }
    },
    removeFromInvoice: (state, action: PayloadAction<string>) => {
      state.pendingInvoiceItems = state.pendingInvoiceItems.filter(
        (item) => item.id !== action.payload,
      );
    },
    clearInvoice: (state) => {
      state.pendingInvoiceItems = [];
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>,
    ) => {
      const item = state.pendingInvoiceItems.find(
        (i) => i.id === action.payload.id,
      );
      if (item) item.quantity = action.payload.quantity;
    },
  },
});

export const { addToInvoice, removeFromInvoice, clearInvoice, updateQuantity } =
  financeSlice.actions;
export default financeSlice.reducer;
