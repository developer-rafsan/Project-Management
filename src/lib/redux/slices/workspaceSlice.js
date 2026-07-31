"use client"

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

export const fetchWorkspaces = createAsyncThunk(
  "workspaces/fetchWorkspaces",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/workspaces")
      if (!res.ok) throw new Error("Failed to fetch workspaces")
      const data = await res.json()
      return data.workspaces || []
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch workspaces")
    }
  }
)

const initialState = {
  workspaces: [],
  currentWorkspaceId: null,
  loading: false,
  error: null,
  fetched: false,
}

const workspaceSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {
    setCurrentWorkspace(state, action) {
      state.currentWorkspaceId = action.payload
      if (typeof window !== "undefined") {
        localStorage.setItem("currentWorkspaceId", action.payload || "")
      }
    },
    restoreWorkspace(state) {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("currentWorkspaceId")
        if (saved) {
          state.currentWorkspaceId = saved
        }
      }
    },
    addWorkspace(state, action) {
      state.workspaces.unshift(action.payload)
    },
    updateWorkspaceInStore(state, action) {
      const idx = state.workspaces.findIndex((w) => w._id === action.payload._id)
      if (idx !== -1) {
        state.workspaces[idx] = action.payload
      }
    },
    removeWorkspace(state, action) {
      state.workspaces = state.workspaces.filter((w) => w._id !== action.payload)
      if (state.currentWorkspaceId === action.payload) {
        state.currentWorkspaceId = state.workspaces[0]?._id || null
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false
        state.workspaces = action.payload
        state.fetched = true
        if (!state.currentWorkspaceId && action.payload.length > 0) {
          state.currentWorkspaceId = action.payload[0]._id
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.fetched = true
      })
  },
})

export const {
  setCurrentWorkspace,
  restoreWorkspace,
  addWorkspace,
  updateWorkspaceInStore,
  removeWorkspace,
} = workspaceSlice.actions
export default workspaceSlice.reducer
