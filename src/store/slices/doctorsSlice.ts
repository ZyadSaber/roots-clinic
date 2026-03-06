import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DoctorStatus } from "@/types/doctors";

interface DoctorUIState {
  filters: {
    status: DoctorStatus | "all";
    specialtyId: string | null;
  };
  selectedDoctorId: string | null;
}

const initialState: DoctorUIState = {
  filters: {
    status: "all",
    specialtyId: null,
  },
  selectedDoctorId: null,
};

const doctorsSlice = createSlice({
  name: "doctors",
  initialState,
  reducers: {
    setSelectedDoctor: (state, action: PayloadAction<string | null>) => {
      state.selectedDoctorId = action.payload;
    },
    setDoctorFilters: (
      state,
      action: PayloadAction<Partial<DoctorUIState["filters"]>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetDoctorFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const { setSelectedDoctor, setDoctorFilters, resetDoctorFilters } =
  doctorsSlice.actions;

export default doctorsSlice.reducer;
