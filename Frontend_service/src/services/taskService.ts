const taskApi = import.meta.env.VITE_TASK_API || 'http://localhost:3002'

export interface CreateTaskInput {
  userId: string
  name: string
  scheduledTime: string
}

export async function createTask(input: CreateTaskInput) {
  const res = await fetch(`${taskApi}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    let message = 'Failed to create task'
    try {
      const data = await res.json()
      message = data?.error?.message || data?.message || message
    } catch {
      // keep default message
    }
    throw new Error(message)
  }

  return res.json()
}
