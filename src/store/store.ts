import { configureStore } from "@reduxjs/toolkit";
import uiSharedReducer from "./slices/uiSharedSlice";
import authReducer from "./slices/authSlice";
import patientReducer from "./slices/patientSlice";
import appointmentReducer from "./slices/appointmentSlice";
import inventoryReducer from "./slices/inventorySlice";
import financeReducer from "./slices/financeSlice";

export const store = configureStore({
  reducer: {
    uiShared: uiSharedReducer,
    auth: authReducer,
    patients: patientReducer,
    appointments: appointmentReducer,
    inventory: inventoryReducer,
    finance: financeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
