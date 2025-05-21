import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

axios.defaults.withCredentials = true; 

export const adminLogin = createAsyncThunk(
  "admin/adminLogin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/login`, credentials, { withCredentials: true });
      return response.data.admin; 
    } catch (err) {
      console.error("Login error:", err.response?.data);  // Log the error response for debugging
      return rejectWithValue(err.response?.data || "Login failed");
    }
  }
);

export const adminLogout = createAsyncThunk(
  "admin/adminLogout", 
  async (_, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/logout`, {}, { withCredentials: true });
      return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    return rejectWithValue(err.response.data);
  }
});

export const refreshAdminSession = createAsyncThunk(
  "admin/refreshAdminSession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/refresh-token`, {}, { withCredentials: true });
      return response.data.admin;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Session refresh failed");
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    admin: null,
    loading: false,
    error: null,
  },
  reducers: {
    logoutAdmin(state) {
      state.admin = null;
    },
    clearAdminError(state) {
      state.error = null; // Clear error state
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.admin = action.payload;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      .addCase(adminLogout.fulfilled, (state) => {
        state.admin = null;
      })
      
      .addCase(refreshAdminSession.fulfilled, (state, action) => {
        state.admin = action.payload;
      })
      .addCase(refreshAdminSession.rejected, (state) => {
        state.admin = null;
      });
  },
});

export const { logoutAdmin, clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
