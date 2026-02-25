import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UISharedState {
  searchQuery: string;
}

const initialState: UISharedState = {
  searchQuery: "",
};

const uiSharedSlice = createSlice({
  name: "uiShared",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { setSearchQuery } = uiSharedSlice.actions;
export default uiSharedSlice.reducer;
