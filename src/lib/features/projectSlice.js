"use client"

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getProjects } from "@/actions/projectActions"

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState()
      const workspaceId = state.workspaces?.currentWorkspaceId
      const filters = { limit: 99999 }
      if (workspaceId) filters.workspaceId = workspaceId
      const data = await getProjects(filters)
      return data
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch projects")
    }
  }
)

const initialState = {
  items: [],
  total: 0,
  totalPrice: 0,
  loading: false,
  error: null,
  fetched: false,
}

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearProjects(state) {
      state.items = []
      state.total = 0
      state.totalPrice = 0
      state.fetched = false
    },
    addProject(state, action) {
      state.items.unshift(action.payload)
      state.total += 1
      state.totalPrice += action.payload.price || 0
    },
    updateProjectInStore(state, action) {
      const idx = state.items.findIndex((p) => p._id === action.payload._id)
      if (idx !== -1) {
        state.items[idx] = action.payload
      }
    },
    removeProject(state, action) {
      const idx = state.items.findIndex((p) => p._id === action.payload)
      if (idx !== -1) {
        const removed = state.items.splice(idx, 1)[0]
        state.total -= 1
        state.totalPrice -= removed.price || 0
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.projects || []
        state.total = action.payload.total || 0
        state.totalPrice = action.payload.totalPrice || 0
        state.fetched = true
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.fetched = true
      })
  },
})

export const { clearProjects, addProject, updateProjectInStore, removeProject } = projectSlice.actions
export default projectSlice.reducer
