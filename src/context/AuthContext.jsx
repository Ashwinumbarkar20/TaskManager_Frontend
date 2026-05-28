/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient, getApiErrorMessage } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('task_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const response = await apiClient.get('/auth/me')
        setUser(response.data?.data?.user ?? null)
      } catch (error) {
        const status = error?.response?.status
        if (status === 401 || status === 403) {
          localStorage.removeItem('task_token')
          setToken(null)
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [token])

  const login = async (payload) => {
    const response = await apiClient.post('/auth/login', payload)
    const authToken = response.data?.data?.token
    const authUser = response.data?.data?.user
    if (!authToken || !authUser) {
      throw new Error('Invalid login response from server')
    }
    localStorage.setItem('task_token', authToken)
    setToken(authToken)
    setUser(authUser)
    return response.data?.message ?? 'Login successful'
  }

  const signup = async (payload) => {
    const response = await apiClient.post('/auth/register', payload)
    const authToken = response.data?.data?.token
    const authUser = response.data?.data?.user
    if (!authToken || !authUser) {
      throw new Error('Invalid register response from server')
    }
    localStorage.setItem('task_token', authToken)
    setToken(authToken)
    setUser(authUser)
    return response.data?.message ?? 'Signup successful'
  }

  const logout = () => {
    localStorage.removeItem('task_token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      signup,
      logout,
      getApiErrorMessage,
    }),
    [loading, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
