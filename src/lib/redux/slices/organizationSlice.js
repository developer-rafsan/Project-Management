"use client"

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

export const fetchOrganizations = createAsyncThunk(
  "organizations/fetchOrganizations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/organizations")
      if (!res.ok) throw new Error("Failed to fetch organizations")
      const data = await res.json()
      return data.organizations || []
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch organizations")
    }
  }
)

const initialState = {
  items: [],
  currentOrgId: null,
  loading: false,
  error: null,
  fetched: false,
}

const organizationSlice = createSlice({
  name: "organizations",
  initialState,
  reducers: {
    setCurrentOrganization(state, action) {
      state.currentOrgId = action.payload
    },
    addOrganization(state, action) {
      state.items.unshift(action.payload)
    },
    updateOrganizationInStore(state, action) {
      const idx = state.items.findIndex((o) => o._id === action.payload._id)
      if (idx !== -1) {
        state.items[idx] = action.payload
      }
    },
    removeOrganization(state, action) {
      state.items = state.items.filter((o) => o._id !== action.payload)
      if (state.currentOrgId === action.payload) {
        state.currentOrgId = state.items[0]?._id || null
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.fetched = true
        if (!state.currentOrgId && action.payload.length > 0) {
          state.currentOrgId = action.payload[0]._id
        }
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.fetched = true
      })
  },
})

export const {
  setCurrentOrganization,
  addOrganization,
  updateOrganizationInStore,
  removeOrganization,
} = organizationSlice.actions
export default organizationSlice.reducer
