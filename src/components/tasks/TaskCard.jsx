import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function statusVariant(status) {
  if (status === 'completed') return 'success'
  if (status === 'pending') return 'warning'
  return 'secondary'
}

function toLabel(value) {
  return value.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function TaskCard({ task, onEdit, onDelete, onToggleStatus }) {
  const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-medium">{task.title}</p>
          <p className="truncate text-sm text-muted-foreground">
            {task.description?.trim() || 'No description added.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(task.status)}>{toLabel(task.status)}</Badge>
          <Badge variant="secondary">Priority: {toLabel(task.priority)}</Badge>
          <Button size="sm" variant="outline" onClick={() => onEdit(task)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggleStatus(task, nextStatus)}>
            Mark {nextStatus === 'completed' ? 'Completed' : 'Pending'}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(task)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
