import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PatientState {
  activePatientId: string | null;
  filters: {
    status: "active" | "inactive" | "all";
  };
  lastVisitedIds: string[];
}

const initialState: PatientState = {
  activePatientId: null,
  filters: {
    status: "all",
  },
  lastVisitedIds: [],
};

const patientSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    setActivePatient: (state, action: PayloadAction<string | null>) => {
      state.activePatientId = action.payload;
      if (action.payload && !state.lastVisitedIds.includes(action.payload)) {
        state.lastVisitedIds = [action.payload, ...state.lastVisitedIds].slice(
          0,
          10,
        );
      }
    },
    setPatientFilters: (
      state,
      action: PayloadAction<Partial<PatientState["filters"]>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setActivePatient, setPatientFilters } = patientSlice.actions;
export default patientSlice.reducer;
