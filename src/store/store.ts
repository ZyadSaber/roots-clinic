import { configureStore } from "@reduxjs/toolkit";
// Import your slices here (we'll create one in step 3)
// import counterReducer from './features/counterSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      // counter: counterReducer,
    },
  });
};

// Infer types for your hooks
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
