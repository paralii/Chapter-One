import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    adminToken: localStorage.getItem('adminToken') || null,
};

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.adminToken = action.payload;
            localStorage.setItem('adminToken', action.payload);
        },
        logout: (state) => {
            state.adminToken = null;
            localStorage.removeItem('adminToken');
        },
    },
});

export const { loginSuccess, logout } = adminSlice.actions;
export default adminSlice.reducer;
