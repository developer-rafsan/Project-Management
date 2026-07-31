import { configureStore } from "@reduxjs/toolkit"
import projectReducer from "@/lib/features/projectSlice"
import workspaceReducer from "@/lib/redux/slices/workspaceSlice"
import organizationReducer from "@/lib/redux/slices/organizationSlice"

export const store = configureStore({
  reducer: {
    projects: projectReducer,
    workspaces: workspaceReducer,
    organizations: organizationReducer,
  },
})
