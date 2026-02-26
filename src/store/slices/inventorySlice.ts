import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface InventoryState {
  lowStockCount: number;
  selectedCategory: string | null;
  searchQuery: string;
}

const initialState: InventoryState = {
  lowStockCount: 0,
  selectedCategory: null,
  searchQuery: "",
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setLowStockCount: (state, action: PayloadAction<number>) => {
      state.lowStockCount = action.payload;
    },
    setInventoryCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setInventorySearch: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { setLowStockCount, setInventoryCategory, setInventorySearch } =
  inventorySlice.actions;
export default inventorySlice.reducer;
