import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const initialForm = { name: '', email: '', password: '' }

function AuthForm({ mode = 'login', onSubmit, busy, serverError }) {
  const isSignup = mode === 'signup'
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
    setErrors((prev) => ({ ...prev, [event.target.name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (isSignup && form.name.trim().length < 2) nextErrors.name = 'Name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email.'
    if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    await onSubmit(form)
  }

  return (
    <Card className="mx-auto w-full max-w-md">
    
      <CardHeader>
        <CardTitle>{isSignup ? 'Create your account' : 'Welcome'}</CardTitle>
        <CardDescription>
          {isSignup ? 'Sign up to manage your tasks.' : 'Log in to access your dashboard.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} />
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
            {isSignup ? 'Sign up' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default AuthForm
