import { configureStore } from "@reduxjs/toolkit"
import projectReducer from "@/lib/features/projectSlice"

export const store = configureStore({
  reducer: {
    projects: projectReducer,
  },
})
