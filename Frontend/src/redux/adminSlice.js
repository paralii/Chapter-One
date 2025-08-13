import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

axios.defaults.withCredentials = true; 

export const adminLogin = createAsyncThunk(
  "admin/adminLogin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/auth/login`, credentials, { withCredentials: true });
      return response.data.admin; 
    } catch (err) {
      console.error("Login error:", err.response?.data);  
      return rejectWithValue(err.response?.data || "Login failed");
    }
  }
);

export const adminLogout = createAsyncThunk(
  "admin/adminLogout", 
  async (_, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/auth/logout`, {}, { withCredentials: true });
      return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    return rejectWithValue(error.response.data);
  }
});

export const refreshAdminSession = createAsyncThunk(
  "admin/refreshAdminSession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/auth/refresh-token`, {}, { withCredentials: true });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Session refresh failed");
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    admin: JSON.parse(localStorage.getItem("admin")) || null,
    loading: false,
    error: null,
  },
  reducers: {
    logoutAdmin(state) {
      state.admin = null;
      localStorage.removeItem("admin");
    },
    clearAdminError(state) {
      state.error = null;
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
        localStorage.setItem("admin", JSON.stringify(action.payload));
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      .addCase(adminLogout.fulfilled, (state) => {
        state.admin = null;
        localStorage.removeItem("admin");
      })
      .addCase(adminLogout.rejected, (state, action) => {
      state.error = action.payload || "Logout failed";
      state.admin = null;
      localStorage.removeItem("admin");
      })
      
      .addCase(refreshAdminSession.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(refreshAdminSession.rejected, (state) => {
        state.admin = null;
        localStorage.removeItem("admin");
      });
  },
});

export const { logoutAdmin, clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
