import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UISharedState {
  searchQuery: string;
  sidebarCollapsed: boolean;
  activeNotifications: number;
  isOnline: boolean;
}

const initialState: UISharedState = {
  searchQuery: "",
  sidebarCollapsed: false,
  activeNotifications: 0,
  isOnline: true,
};

const uiSharedSlice = createSlice({
  name: "uiShared",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setNotificationsCount: (state, action: PayloadAction<number>) => {
      state.activeNotifications = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
  },
});

export const {
  setSearchQuery,
  toggleSidebar,
  setSidebarCollapsed,
  setNotificationsCount,
  setOnlineStatus,
} = uiSharedSlice.actions;
export default uiSharedSlice.reducer;
