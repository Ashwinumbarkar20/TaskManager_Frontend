import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthForm from '@/components/auth/AuthForm'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

function AuthPage() {
  const navigate = useNavigate()
  const { login, signup, getApiErrorMessage } = useAuth()
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState('')

  const isSignup = mode === 'signup'

  const handleSubmit = async (payload) => {
    try {
      setBusy(true)
      setServerError('')
      if (isSignup) {
        await signup(payload)
      } else {
        await login(payload)
      }
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Authentication failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
    <h1 className="text-2xl font-bold text-center mb-4">TASK MANAGER</h1>
      <div className="w-full max-w-md space-y-4">
        <AuthForm mode={mode} onSubmit={handleSubmit} busy={busy} serverError={serverError} />
        <div className="text-center text-sm">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Button variant="ghost" className="h-auto p-0" onClick={() => setMode(isSignup ? 'login' : 'signup')}>
            {isSignup ? 'Login' : 'Sign up'}
          </Button>
        </div>
      </div>
    </main>
  )
}

export default AuthPage
