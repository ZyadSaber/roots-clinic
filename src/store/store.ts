import { configureStore } from "@reduxjs/toolkit";
import uiSharedReducer from "./slices/uiSharedSlice";
import authReducer from "./slices/authSlice";
import doctorsReducer from "./slices/doctorsSlice";
import patientsReducer from "./slices/patientSlice";
import staffReducer from "./slices/staff";

export const store = configureStore({
  reducer: {
    uiShared: uiSharedReducer,
    auth: authReducer,
    doctors: doctorsReducer,
    patients: patientsReducer,
    staff: staffReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
