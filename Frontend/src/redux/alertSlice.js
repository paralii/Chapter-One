// redux/alertSlice.js
import { createSlice } from "@reduxjs/toolkit";

const alertSlice = createSlice({
  name: "alert",
  initialState: {
    message: "",
    isOpen: false,
    type: "info", // add this line
  },
  reducers: {
    showAlert: (state, action) => {
      state.message = action.payload.message;
      state.type = action.payload.type || "info"; // default to "info"
      state.isOpen = true;
    },
    hideAlert: (state) => {
      state.message = "";
      state.isOpen = false;
      state.type = "info";
    },
  },
});

export const { showAlert, hideAlert } = alertSlice.actions;
export default alertSlice.reducer;
