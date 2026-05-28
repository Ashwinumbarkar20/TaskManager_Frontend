import { Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from '@/pages/AuthPage'
import DashboardPage from '@/pages/DashboardPage'
import AdminPage from '@/pages/AdminPage'
import { useAuth } from '@/context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-content-center">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-content-center">Loading...</div>
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            {user?.role === 'admin' ? <AdminPage /> : <DashboardPage />}
          </ProtectedRoute>
        )}
      />
      <Route
        path="/auth"
        element={(
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
