import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Appointment, AppointmentFilters } from "@/types/appointments";

interface AppointmentsState {
  data: Appointment[];
  filters: AppointmentFilters;
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentsState = {
  data: [],
  filters: {
    search: "",
    status: "All",
    doctor_id: "All",
    date: null,
  },
  searchQuery: "",
  loading: false,
  error: null,
};

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    setAppointmentsState: (
      state: AppointmentsState,
      action: PayloadAction<Appointment[]>,
    ) => {
      state.data = action.payload;
      state.loading = false;
    },
    setAppointmentsLoading: (
      state: AppointmentsState,
      action: PayloadAction<boolean>,
    ) => {
      state.loading = action.payload;
    },
    setAppointmentsError: (
      state: AppointmentsState,
      action: PayloadAction<string | null>,
    ) => {
      state.error = action.payload;
      state.loading = false;
    },
    setAppointmentFilters: (
      state: AppointmentsState,
      action: PayloadAction<Partial<AppointmentFilters>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setAppointmentsSearchQuery: (
      state: AppointmentsState,
      action: PayloadAction<string>,
    ) => {
      state.searchQuery = action.payload;
    },
    resetAppointmentFilters: (state: AppointmentsState) => {
      state.filters = initialState.filters;
      state.searchQuery = "";
    },
    addAppointment: (
      state: AppointmentsState,
      action: PayloadAction<Appointment>,
    ) => {
      state.data.unshift(action.payload);
    },
    updateAppointmentInStore: (
      state: AppointmentsState,
      action: PayloadAction<Appointment>,
    ) => {
      const index = state.data.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = action.payload;
      }
    },
    deleteAppointmentFromStore: (
      state: AppointmentsState,
      action: PayloadAction<string>,
    ) => {
      state.data = state.data.filter((a) => a.id !== action.payload);
    },
  },
});

export const {
  setAppointmentsState,
  setAppointmentsLoading,
  setAppointmentsError,
  setAppointmentFilters,
  setAppointmentsSearchQuery,
  resetAppointmentFilters,
  addAppointment,
  updateAppointmentInStore,
  deleteAppointmentFromStore,
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;
