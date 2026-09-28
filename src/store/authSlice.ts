import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ApiService } from '@apiServices/ApiService'
import AuthStorage from '@context/AuthStorage'

interface User {
  name: string | null
  email: string | null
}

interface AuthState {
  user: User | null
  loading: boolean
  error: any
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null
}

const restApi: ApiService = ApiService.getInstance()

// Async thunks
export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await restApi.loginService.login(email, password)
    if (response?.data) {
      AuthStorage.saveToken(response.data.data)
      return {
        name: response.data.data.name,
        email: response.data.data.email
      }
    }
    throw new Error('Login failed')
  }
)

export const changePasswordAsync = createAsyncThunk(
  'auth/changePassword',
  async ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) => {
    // Add your change password logic here
    return true
  }
)

export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async () => {
    // Token refresh is handled by the axios interceptor in RestAxiosService
    throw new Error('Token refresh failed')
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      AuthStorage.deleteToken()
      state.user = null
      state.error = null

      
    },
    initializeAuth: (state) => {
      const token = AuthStorage.getToken()
      if (token) {
        const parObj = JSON.parse(token)
        state.user = {
          name: parObj?.name,
          email: parObj?.email
        }
      }
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(changePasswordAsync.pending, (state) => {
        state.loading = true
      })
      .addCase(changePasswordAsync.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(changePasswordAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(refreshTokenAsync.pending, (state) => {
        state.loading = true
      })
      .addCase(refreshTokenAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  }
})

export const { logout, initializeAuth, clearError } = authSlice.actions
export default authSlice.reducer