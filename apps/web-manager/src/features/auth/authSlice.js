import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setAuthToken } from '../../api/apiClient';
import { authApi } from './authApi';

// Initialize from localStorage
const token = localStorage.getItem('token');

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getUserInfo();
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user info');
    }
  }
);

export const updateAccount = createAsyncThunk(
  'auth/updateAccount',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.updateUserAccount(data);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update account');
    }
  }
);

const initialState = {
  isAuthenticated: !!token,
  token: token || null,
  user: null, // Detailed user object from /user
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user; // This might be partial from login
      state.error = null;
      localStorage.setItem('token', action.payload.token);
      setAuthToken(action.payload.token);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem('token');
      setAuthToken(null);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
