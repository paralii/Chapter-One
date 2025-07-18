import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

axios.defaults.withCredentials = true;

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async ({ firstname, lastname, email, password, referral_code }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/signup`, { firstname, lastname, email, password, referral_code: referral_code || undefined });
      if (response.data.otpToken) {
        localStorage.setItem("otpToken", response.data.otpToken);
      }      
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ email, otp, otpToken }, { rejectWithValue }) => {
    try {
      if (!otpToken) throw new Error("OTP token missing or expired");
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/verify-otp`, { email, otp, otpToken });
      console.log(response)
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      localStorage.removeItem("otpToken");
      return response.data;
    } catch (err) {
      console.error("Error verifying OTP:", err.response);
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);


export const resendOtpForVerify = createAsyncThunk(
  'auth/resendOtpForVerify',
  async ({ otpToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/resend-otp-verify`, { otpToken });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend OTP');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/login`, credentials, { withCredentials: true });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/logout`, {}, { withCredentials: true });
      return response;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/forgot-password`, { email });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);


export const verifyForgotPasswordOTP = createAsyncThunk(
  'auth/verifyForgotPasswordOTP',
  async ({ email, otp, otpToken }, { rejectWithValue }) => {
    try {
      if (!otpToken) throw new Error("OTP token missing or expired");

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/verify-forgot-password-otp`, {
        email,
        otp,
        otpToken
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const resendForgotPasswordOTP = createAsyncThunk(
  'auth/resendForgotPasswordOTP',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/resend-forgot-password-otp`, { email });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ otpToken, otp, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/reset-password`, { otpToken, otp, newPassword });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user/me`, {
        withCredentials: true,
      });
      console.log("fetchCurrentUser response:", response.data);
      return response.data;
    } catch (err) {
      console.error("fetchCurrentUser error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,
    otpToken: localStorage.getItem("otpToken") || null, 
    signupMessage: '',
    resetPasswordMessage: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
    },
    clearMessages(state) {
      state.signupMessage = '';
      state.error = null;
    },
    resetResetPasswordMessage(state) {
      state.resetPasswordMessage = null;
    }
        
  },
  extraReducers: (builder) => {
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.signupMessage = action.payload.message;
        state.otpToken = action.payload.otpToken;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.signupMessage = action.payload.message;
        state.otpToken = null;
        state.user = action.payload.user;  
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resendOtpForVerify.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOtpForVerify.fulfilled, (state, action) => {
        state.loading = false;
        state.signupMessage = action.payload.message;
        state.otpToken = action.payload.otpToken; 
      })
      .addCase(resendOtpForVerify.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.otpToken = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.signupMessage = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetPasswordMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.resetPasswordMessage = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Password reset failed";
      })
    
      .addCase(verifyForgotPasswordOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyForgotPasswordOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.signupMessage = action.payload.message;
      })
      .addCase(verifyForgotPasswordOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resendForgotPasswordOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendForgotPasswordOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.otpToken = action.payload.otpToken;
        state.message = action.payload.message;
      })
      .addCase(resendForgotPasswordOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to resend OTP";
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.user = action.payload;
        state.error = null;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = "succeeded";
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.error = action.payload.message;
        console.error("fetchCurrentUser rejected:", action.payload);
      });
      
  },
});

export const { logout, clearMessages, resetResetPasswordMessage } = authSlice.actions;
export default authSlice.reducer;
