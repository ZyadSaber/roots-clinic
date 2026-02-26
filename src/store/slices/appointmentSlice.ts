import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppointmentState {
  viewMode: "day" | "week" | "month";
  selectedDate: string; // ISO String
  filters: {
    doctorId: string | null;
    status: string | null;
  };
}

const initialState: AppointmentState = {
  viewMode: "day",
  selectedDate: new Date().toISOString(),
  filters: {
    doctorId: null,
    status: null,
  },
};

const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    setViewMode: (
      state,
      action: PayloadAction<AppointmentState["viewMode"]>,
    ) => {
      state.viewMode = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setAppointmentFilters: (
      state,
      action: PayloadAction<Partial<AppointmentState["filters"]>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setViewMode, setSelectedDate, setAppointmentFilters } =
  appointmentSlice.actions;
export default appointmentSlice.reducer;
