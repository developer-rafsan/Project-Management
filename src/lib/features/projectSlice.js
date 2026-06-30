"use client"

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getProjects } from "@/actions/projectActions"

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getProjects({ limit: 99999 })
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

export const { clearProjects, addProject } = projectSlice.actions
export default projectSlice.reducer
