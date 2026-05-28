/**
 * End-to-end API test against live backend
 * Run: node scripts/e2e-api-test.mjs
 */

const BASE = 'https://taskmanager-backend-lm8b.onrender.com/api'
const ts = Date.now()
const userEmail = `e2e_user_${ts}@test.com`
const userPassword = 'test123456'
const userName = 'E2E Test User'

let passed = 0
let failed = 0
const results = []

function log(name, ok, detail = '') {
  const status = ok ? 'PASS' : 'FAIL'
  results.push({ name, ok, detail })
  if (ok) passed++
  else failed++
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ''}`)
}

async function request(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, data }
}

async function run() {
  console.log('\n=== Task Manager E2E API Tests ===\n')
  console.log(`Base URL: ${BASE}\n`)

  // 1. Health
  try {
    const { status, data } = await request('GET', '/health')
    log('Health check', status === 200 && data?.success !== false, `status ${status}`)
  } catch (e) {
    log('Health check', false, e.message)
  }

  // 2. Register
  let userToken = null
  let userId = null
  try {
    const { status, data } = await request('POST', '/auth/register', {
      body: { name: userName, email: userEmail, password: userPassword },
    })
    userToken = data?.data?.token
    userId = data?.data?.user?.id
    log('User register', status === 201 && !!userToken, `status ${status}`)
  } catch (e) {
    log('User register', false, e.message)
  }

  // 3. Login
  try {
    const { status, data } = await request('POST', '/auth/login', {
      body: { email: userEmail, password: userPassword },
    })
    userToken = data?.data?.token || userToken
    log('User login', status === 200 && !!data?.data?.token, `status ${status}`)
  } catch (e) {
    log('User login', false, e.message)
  }

  // 4. Auth me
  try {
    const { status, data } = await request('GET', '/auth/me', { token: userToken })
    log('Auth /me', status === 200 && !!data?.data?.user, `status ${status}`)
  } catch (e) {
    log('Auth /me', false, e.message)
  }

  // 5. Create task
  let taskId = null
  try {
    const { status, data } = await request('POST', '/tasks', {
      token: userToken,
      body: {
        title: `E2E Task ${ts}`,
        description: 'Automated test task',
        status: 'pending',
        priority: 'medium',
      },
    })
    taskId = data?.data?.task?._id
    log('Create task', status === 201 && !!taskId, `status ${status}`)
  } catch (e) {
    log('Create task', false, e.message)
  }

  // 6. List tasks
  try {
    const { status, data } = await request('GET', '/tasks', { token: userToken })
    const tasks = data?.data?.tasks ?? []
    log('List tasks', status === 200 && Array.isArray(tasks), `count ${tasks.length}`)
  } catch (e) {
    log('List tasks', false, e.message)
  }

  // 7. Filter pending
  try {
    const { status, data } = await request('GET', '/tasks?status=pending', { token: userToken })
    log('Filter pending tasks', status === 200, `status ${status}`)
  } catch (e) {
    log('Filter pending tasks', false, e.message)
  }

  // 8. Update task
  try {
    const { status, data } = await request('PUT', `/tasks/${taskId}`, {
      token: userToken,
      body: { title: `E2E Updated ${ts}`, status: 'completed' },
    })
    log('Update task', status === 200 && data?.data?.task?.status === 'completed', `status ${status}`)
  } catch (e) {
    log('Update task', false, e.message)
  }

  // 9. Toggle back to pending
  try {
    const { status } = await request('PUT', `/tasks/${taskId}`, {
      token: userToken,
      body: { status: 'pending' },
    })
    log('Mark task pending', status === 200, `status ${status}`)
  } catch (e) {
    log('Mark task pending', false, e.message)
  }

  // 10. Delete task
  try {
    const { status } = await request('DELETE', `/tasks/${taskId}`, { token: userToken })
    log('Delete task', status === 200, `status ${status}`)
  } catch (e) {
    log('Delete task', false, e.message)
  }

  // 11. Admin login (from backend seed defaults)
  let adminToken = null
  try {
    const { status, data } = await request('POST', '/auth/login', {
      body: { email: 'admin@gmail.com', password: 'admin123' },
    })
    adminToken = data?.data?.token
    const isAdmin = data?.data?.user?.role === 'admin'
    log('Admin login', status === 200 && !!adminToken && isAdmin, `status ${status}`)
  } catch (e) {
    log('Admin login', false, e.message)
  }

  // 12. Admin dashboard
  try {
    const { status, data } = await request('GET', '/admin/dashboard', { token: adminToken })
    const hasStats = !!data?.data?.users && !!data?.data?.tasks
    log('Admin dashboard stats', status === 200 && hasStats, `status ${status}`)
  } catch (e) {
    log('Admin dashboard stats', false, e.message)
  }

  // 13. Admin users list
  let targetUserId = userId
  try {
    const { status, data } = await request('GET', '/admin/users?page=1&limit=10', { token: adminToken })
    const users = data?.data?.users ?? []
    if (!targetUserId && users[0]) targetUserId = users[0]._id
    log('Admin users list', status === 200 && Array.isArray(users), `count ${users.length}`)
  } catch (e) {
    log('Admin users list', false, e.message)
  }

  // 14. Deactivate user (if we have a test user id)
  if (targetUserId && adminToken) {
    try {
      const { status, data } = await request('PATCH', `/admin/users/${targetUserId}/status`, {
        token: adminToken,
        body: { isActive: false },
      })
      log('Admin deactivate user', status === 200 && data?.data?.user?.isActive === false, `status ${status}`)
    } catch (e) {
      log('Admin deactivate user', false, e.message)
    }

    // 15. Reactivate user
    try {
      const { status, data } = await request('PATCH', `/admin/users/${targetUserId}/status`, {
        token: adminToken,
        body: { isActive: true },
      })
      log('Admin activate user', status === 200 && data?.data?.user?.isActive === true, `status ${status}`)
    } catch (e) {
      log('Admin activate user', false, e.message)
    }
  } else {
    log('Admin deactivate user', false, 'skipped — no user id')
    log('Admin activate user', false, 'skipped — no user id')
  }

  // Summary
  console.log('\n=== Summary ===')
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total:  ${passed + failed}\n`)

  if (failed > 0) {
    console.log('Failed tests:')
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`))
    process.exit(1)
  }
  process.exit(0)
}

run().catch((err) => {
  console.error('E2E runner crashed:', err)
  process.exit(1)
})
