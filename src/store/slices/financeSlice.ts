import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { InvoiceFilters } from "@/types/finance";
import type { DateRangeValue } from "@/components/ui/DateRangePicker";

function defaultDateRange(): DateRangeValue {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 7);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

interface FinanceState {
  invoiceFilters: InvoiceFilters;
  dateRange: DateRangeValue;
}

const initialState: FinanceState = {
  invoiceFilters: { status: "all" },
  dateRange: defaultDateRange(),
};

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    setInvoiceFilters: (state, action: PayloadAction<Partial<InvoiceFilters>>) => {
      state.invoiceFilters = { ...state.invoiceFilters, ...action.payload };
    },
    setDateRange: (state, action: PayloadAction<DateRangeValue>) => {
      state.dateRange = action.payload;
    },
  },
});

export const { setInvoiceFilters, setDateRange } = financeSlice.actions;
export default financeSlice.reducer;
