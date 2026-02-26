import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchAvailableDoctors } from "@/services/doctors";
import { DoctorState, DoctorStatus } from "@/types/doctors";

// ================================
// INITIAL STATE
// ================================

const initialState: DoctorState = {
  availableDoctors: [],
  filters: {
    status: "all",
    specialtyId: null,
    searchQuery: "",
  },
  selectedDoctorId: null,
  loading: false,
  error: null,
};

// ================================
// ASYNC THUNK
// Calls the server action to fetch the lightweight doctor list
// ================================

export const loadAvailableDoctors = createAsyncThunk(
  "doctors/loadAvailable",
  async (_, { rejectWithValue }) => {
    try {
      const doctors = await fetchAvailableDoctors();
      return doctors;
    } catch (err) {
      console.error("Failed to load doctors", err);
      return rejectWithValue("Failed to load doctors");
    }
  },
);

// ================================
// SLICE
// ================================

const doctorsSlice = createSlice({
  name: "doctors",
  initialState,
  reducers: {
    setSelectedDoctor: (state, action: PayloadAction<string | null>) => {
      state.selectedDoctorId = action.payload;
    },
    setDoctorFilters: (
      state,
      action: PayloadAction<Partial<DoctorState["filters"]>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetDoctorFilters: (state) => {
      state.filters = initialState.filters;
    },
    // For real-time status updates (e.g. doctor goes in_session)
    updateDoctorStatus: (
      state,
      action: PayloadAction<{ doctorId: string; status: DoctorStatus }>,
    ) => {
      const doctor = state.availableDoctors.find(
        (d) => d.id === action.payload.doctorId,
      );
      if (doctor) {
        doctor.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAvailableDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAvailableDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.availableDoctors = action.payload;
      })
      .addCase(loadAvailableDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedDoctor,
  setDoctorFilters,
  resetDoctorFilters,
  updateDoctorStatus,
} = doctorsSlice.actions;

export default doctorsSlice.reducer;
