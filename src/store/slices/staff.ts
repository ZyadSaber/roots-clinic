import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── State ────────────────────────────────────────────────────

export type UsersFilter = "all" | "active" | "inactive";

interface UsersState {
  selectedUserId: string | null;
  filter: {
    role: string;
    status: UsersFilter;
  };
}

const initialState: UsersState = {
  selectedUserId: null,
  filter: {
    role: "all",
    status: "all",
  },
};

// ─── Slice ────────────────────────────────────────────────────

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    setSelectedUserId(state, action: PayloadAction<string | null>) {
      state.selectedUserId = action.payload;
    },
    setRoleFilter(state, action: PayloadAction<string>) {
      state.filter.role = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<UsersFilter>) {
      state.filter.status = action.payload;
    },
    resetFilters(state) {
      state.filter = initialState.filter;
    },
  },
});

// ─── Actions ─────────────────────────────────────────────────

export const {
  setSelectedUserId,
  setRoleFilter,
  setStatusFilter,
  resetFilters,
} = staffSlice.actions;
export default staffSlice.reducer;
