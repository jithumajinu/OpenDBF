import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './useAppDispatch'
import { loginAsync, logout, initializeAuth, changePasswordAsync, clearError } from '../store/authSlice'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, loading, error } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(initializeAuth())
  }, [dispatch])

  const login = async (email: string, password: string) => {
    return dispatch(loginAsync({ email, password }))
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    return dispatch(changePasswordAsync({ oldPassword, newPassword }))
  }

  const canView = (area: string) => {
    return user !== null
  }

  const sendOTP = async (payload: any) => {
    // Implement OTP logic here
    return Promise.resolve()
  }

  const signUp = (email: string, name: string, password: string) => {
    // Implement signup logic here
  }

  return {
    user,
    loading,
    error,
    login,
    logout: handleLogout,
    changePassword,
    canView,
    sendOTP,
    signUp,
    clearError: () => dispatch(clearError())
  }
}