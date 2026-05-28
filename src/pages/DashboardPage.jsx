import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, LogOut, Plus, X } from 'lucide-react'
import TaskCard from '@/components/tasks/TaskCard'
import TaskForm from '@/components/tasks/TaskForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiClient, getApiErrorMessage } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function DashboardPage() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState([])
  const [summary, setSummary] = useState({ total: 0, completed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTask, setEditTask] = useState(null)

  const loadTasks = async (searchValue = search) => {
    try {
      setLoading(true)
      const params = {}
      if (filter !== 'all') params.status = filter
      if (searchValue.trim()) params.search = searchValue.trim()
      const response = await apiClient.get('/tasks', { params })
      setTasks(response.data?.data?.tasks ?? [])
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to fetch tasks'))
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const [allRes, completedRes, pendingRes] = await Promise.all([
        apiClient.get('/tasks', { params: { page: 1, limit: 1 } }),
        apiClient.get('/tasks', { params: { status: 'completed', page: 1, limit: 1 } }),
        apiClient.get('/tasks', { params: { status: 'pending', page: 1, limit: 1 } }),
      ])

      setSummary({
        total: allRes.data?.data?.pagination?.total ?? 0,
        completed: completedRes.data?.data?.pagination?.total ?? 0,
        pending: pendingRes.data?.data?.pagination?.total ?? 0,
      })
    } catch {
      // Keep the previous summary if this fails.
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks()
    loadSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const taskStats = useMemo(() => summary, [summary])

  const handleCreate = async (payload) => {
    try {
      setSubmitting(true)
      const response = await apiClient.post('/tasks', payload)
      const createdTask = response.data?.data?.task
      if (createdTask) {
        const matchesFilter = filter === 'all' || createdTask.status === filter
        const normalizedSearch = search.trim().toLowerCase()
        const matchesSearch = !normalizedSearch || `${createdTask.title ?? ''} ${createdTask.description ?? ''}`.toLowerCase().includes(normalizedSearch)
        if (matchesFilter && matchesSearch) {
          setTasks((prev) => [createdTask, ...prev])
        }
      }
      setShowCreate(false)
      setMessage('Task created successfully.')
      loadSummary()
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to create task'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (payload) => {
    if (!editTask) return
    const previousTasks = tasks
    const updatedTask = { ...editTask, ...payload }
    const matchesCurrentFilter = filter === 'all' || updatedTask.status === filter
    const optimisticTasks = matchesCurrentFilter
      ? tasks.map((item) => (item._id === editTask._id ? updatedTask : item))
      : tasks.filter((item) => item._id !== editTask._id)

    try {
      setSubmitting(true)
      setTasks(optimisticTasks)
      await apiClient.put(`/tasks/${editTask._id}`, payload)
      setEditTask(null)
      setMessage('Task updated successfully.')
      loadSummary()
    } catch (error) {
      setTasks(previousTasks)
      setMessage(getApiErrorMessage(error, 'Unable to update task'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (task) => {
    const previousTasks = tasks
    const optimisticTasks = tasks.filter((item) => item._id !== task._id)
    try {
      setTasks(optimisticTasks)
      await apiClient.delete(`/tasks/${task._id}`)
      setMessage('Task deleted successfully.')
      loadSummary()
    } catch (error) {
      setTasks(previousTasks)
      setMessage(getApiErrorMessage(error, 'Unable to delete task'))
    }
  }

  const handleToggleStatus = async (task, nextStatus) => {
    const previousTasks = tasks
    const isFilteredOut = filter !== 'all' && nextStatus !== filter
    const optimisticTasks = isFilteredOut
      ? tasks.filter((item) => item._id !== task._id)
      : tasks.map((item) => (item._id === task._id ? { ...item, status: nextStatus } : item))

    setTasks(optimisticTasks)
    try {
      await apiClient.put(`/tasks/${task._id}`, { status: nextStatus })
      setMessage(`Task marked as ${nextStatus === 'completed' ? 'completed' : 'pending'}.`)
      loadSummary()
    } catch (error) {
      setTasks(previousTasks)
      setMessage(getApiErrorMessage(error, 'Unable to update task status'))
    }
  }

  return (
    <main className="min-h-screen bg-muted/40 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Task Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 size-4" />
            Logout
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{taskStats.total}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Completed</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{taskStats.completed}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{taskStats.pending}</CardContent></Card>
        </section>

        <section className="rounded-lg border bg-background p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex gap-2">
              <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
              <Button variant={filter === 'completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')}>Completed</Button>
              <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
            </div>
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Search by title/description"
                value={search}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setSearch(nextValue)
                  if (!nextValue.trim()) {
                    loadTasks('')
                  }
                }}
              />
              <Button variant="outline" onClick={() => loadTasks(search)}>Search</Button>
            </div>
            <Button onClick={() => setShowCreate((prev) => !prev)}>
              <Plus className="mr-2 size-4" />
              New Task
            </Button>
          </div>

          {message && <p className="text-sm text-muted-foreground">{message}</p>}

          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <LoaderCircle className="mr-2 size-4 animate-spin" />
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No tasks found.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={setEditTask}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Create Task</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowCreate(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <TaskForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreate(false)}
                busy={submitting}
                submitLabel="Create task"
              />
            </CardContent>
          </Card>
        </div>
      )}
      {editTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Edit Task</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditTask(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <TaskForm
                initialValues={editTask}
                onSubmit={handleUpdate}
                onCancel={() => setEditTask(null)}
                busy={submitting}
                submitLabel="Update task"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}

export default DashboardPage
