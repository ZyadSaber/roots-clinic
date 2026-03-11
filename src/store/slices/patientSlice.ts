import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PatientGender = "male" | "female" | "all";

interface PatientFilters {
  gender: PatientGender;
  hasInsurance: boolean;
  hasCriticalAlert: boolean;
  search: string;
}

interface PatientUIState {
  filters: PatientFilters;
  selectedPatientId: string | null;
  bookingPatient: {
    patient_id: string;
    patient_name: string;
  } | null;
}

const initialState: PatientUIState = {
  filters: {
    gender: "all",
    hasInsurance: false,
    hasCriticalAlert: false,
    search: "",
  },
  selectedPatientId: null,
  bookingPatient: null,
};

const patientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    setSelectedPatient: (state, action: PayloadAction<string | null>) => {
      state.selectedPatientId = action.payload;
    },
    setBookingPatient: (
      state,
      action: PayloadAction<PatientUIState["bookingPatient"]>,
    ) => {
      state.bookingPatient = action.payload;
    },
    setPatientFilters: (
      state,
      action: PayloadAction<Partial<PatientFilters>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetPatientFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedPatient: (state) => {
      state.selectedPatientId = null;
      state.bookingPatient = null;
    },
  },
});

export const {
  setSelectedPatient,
  setPatientFilters,
  resetPatientFilters,
  clearSelectedPatient,
  setBookingPatient,
} = patientsSlice.actions;

export default patientsSlice.reducer;
