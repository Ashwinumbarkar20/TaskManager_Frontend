import { useCallback, useEffect, useMemo, useState } from 'react'
import { LoaderCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiClient, getApiErrorMessage } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function AdminPage() {
  const { user, logout } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [users, setUsers] = useState([])
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const usersFilterParam = useMemo(() => {
    if (activeFilter === 'active') return 'true'
    if (activeFilter === 'inactive') return 'false'
    return undefined
  }, [activeFilter])

  const loadDashboard = useCallback(async () => {
    try {
      setLoadingDashboard(true)
      const response = await apiClient.get('/admin/dashboard')
      setDashboard(response.data?.data ?? null)
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to fetch admin dashboard'))
    } finally {
      setLoadingDashboard(false)
    }
  }, [])

  const loadUsers = useCallback(async (searchValue = '') => {
    try {
      setLoadingUsers(true)
      const params = { page: 1, limit: 50 }
      if (searchValue.trim()) params.search = searchValue.trim()
      if (usersFilterParam !== undefined) params.isActive = usersFilterParam
      const response = await apiClient.get('/admin/users', { params })
      setUsers(response.data?.data?.users ?? [])
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to fetch users'))
    } finally {
      setLoadingUsers(false)
    }
  }, [usersFilterParam])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers()
  }, [usersFilterParam, loadUsers])

  const handleSearch = () => {
    loadUsers(search)
  }

  const handleClearSearch = () => {
    setSearch('')
    loadUsers('')
  }

  const handleToggleUserStatus = async (targetUser) => {
    const nextIsActive = !targetUser.isActive
    const previousUsers = users
    const previousDashboard = dashboard
    const optimisticUsers = users.map((item) =>
      item._id === targetUser._id ? { ...item, isActive: nextIsActive } : item,
    )

    setUsers(optimisticUsers)
    setDashboard((prev) => {
      if (!prev?.users) return prev
      return {
        ...prev,
        users: {
          ...prev.users,
          active: prev.users.active + (nextIsActive ? 1 : -1),
          inactive: prev.users.inactive + (nextIsActive ? -1 : 1),
        },
      }
    })
    setUpdatingUserId(targetUser._id)
    try {
      await apiClient.patch(`/admin/users/${targetUser._id}/status`, {
        isActive: nextIsActive,
      })
      setMessage(`User ${nextIsActive ? 'activated' : 'deactivated'} successfully.`)
    } catch (error) {
      setUsers(previousUsers)
      setDashboard(previousDashboard)
      setMessage(getApiErrorMessage(error, 'Unable to update user status'))
    } finally {
      setUpdatingUserId('')
    }
  }

  return (
    <main className="min-h-screen bg-muted/40 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.name} ({user?.role})
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 size-4" />
            Logout
          </Button>
        </header>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Stats</h2>
          {loadingDashboard ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading admin stats...
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Users - Total</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{dashboard?.users?.total ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Users - Active</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{dashboard?.users?.active ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Users - Inactive</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{dashboard?.users?.inactive ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tasks - Total</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{dashboard?.tasks?.total ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tasks - Pending</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{dashboard?.tasks?.byStatus?.pending ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tasks - In Progress</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{dashboard?.tasks?.byStatus?.in_progress ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tasks - Completed</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{dashboard?.tasks?.byStatus?.completed ?? 0}</CardContent>
              </Card>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-background p-4 space-y-4">
          <h2 className="text-lg font-semibold">User List</h2>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex gap-2">
              <Button variant={activeFilter === 'all' ? 'default' : 'outline'} onClick={() => setActiveFilter('all')}>
                All
              </Button>
              <Button variant={activeFilter === 'active' ? 'default' : 'outline'} onClick={() => setActiveFilter('active')}>
                Active
              </Button>
              <Button variant={activeFilter === 'inactive' ? 'default' : 'outline'} onClick={() => setActiveFilter('inactive')}>
                Inactive
              </Button>
            </div>
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Search users by name/email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch()
                }}
              />
              <Button variant="outline" onClick={handleSearch}>Search</Button>
              {search.trim() ? (
                <Button variant="ghost" onClick={handleClearSearch}>Clear</Button>
              ) : null}
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-2">
              {users.map((item) => (
                <div key={item._id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{item.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.isActive ? 'success' : 'warning'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="secondary">{item.role}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleUserStatus(item)}
                        disabled={updatingUserId === item._id}
                      >
                        {updatingUserId === item._id ? (
                          <>
                            <LoaderCircle className="mr-2 size-4 animate-spin" />
                            Updating...
                          </>
                        ) : item.isActive ? (
                          'Deactivate'
                        ) : (
                          'Activate'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default AdminPage
