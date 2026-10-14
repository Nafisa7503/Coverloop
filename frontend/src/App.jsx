
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'
const DEMO_ACCESS_CODE = 'coverloop2026'

const initialShifts = [
  { id: 1, day: 'Monday', date: '19 Oct', time: '9:00 AM – 2:00 PM', role: 'Cashier', status: 'Scheduled' },
  { id: 2, day: 'Wednesday', date: '21 Oct', time: '4:00 PM – 9:00 PM', role: 'Customer Service', status: 'Scheduled' },
  { id: 3, day: 'Friday', date: '23 Oct', time: '10:00 AM – 4:00 PM', role: 'Cashier', status: 'Scheduled' },
]

function App() {
  const [isDark, setIsDark] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [shifts, setShifts] = useState(initialShifts)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    email: 'demo@coverloop.com',
    password: DEMO_ACCESS_CODE,
    remember: true,
  })

  const verifyAccess = async (accessCode) => {
    try {
      const response = await fetch(`${API_URL}/requests`, {
        headers: {
          'X-Demo-Access': accessCode,
        },
      })

      if (!response.ok) {
        return accessCode === DEMO_ACCESS_CODE
      }

      return true
    } catch (error) {
      console.error(error)
      return accessCode === DEMO_ACCESS_CODE
    }
  }

  const loadRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/requests`, {
        headers: {
          'X-Demo-Access': formData.password || DEMO_ACCESS_CODE,
        },
      })

      if (!response.ok) {
        if ((formData.password || DEMO_ACCESS_CODE) !== DEMO_ACCESS_CODE) {
          throw new Error('Failed to load requests')
        }
        setRequests([])
        return
      }

      const data = await response.json()
      setRequests(data)
      setShifts((currentShifts) =>
        currentShifts.map((shift) => ({
          ...shift,
          status: data.some((request) => request.shift_id === shift.id)
            ? 'Coverage Requested'
            : 'Scheduled',
        }))
      )
    } catch (error) {
      console.error(error)
      setRequests([])
      setShifts(initialShifts)
      setMessage('Backend unavailable. Using local demo data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (signedIn) {
      loadRequests()
    }
  }, [signedIn])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const accessCode = (formData.password || DEMO_ACCESS_CODE).trim()

    if (!formData.email || !accessCode) {
      setMessage('Please enter your email and access code.')
      return
    }

    if (accessCode === DEMO_ACCESS_CODE) {
      setSignedIn(true)
      setActivePage('Dashboard')
      setMessage('')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const isAuthorized = await verifyAccess(accessCode)

      if (!isAuthorized) {
        throw new Error('Access denied')
      }

      setSignedIn(true)
      setActivePage('Dashboard')
      setMessage('')
    } catch (error) {
      console.error(error)
      setMessage('Invalid email or access code. Use the demo code shown below.')
    } finally {
      setLoading(false)
    }
  }

  const requestCoverage = async (shift) => {
    if (requests.some((request) => request.shift_id === shift.id)) {
      setMessage('Coverage already requested for this shift.')
      return
    }

    try {
      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Access': formData.password,
        },
        body: JSON.stringify({
          shift_id: shift.id,
          employee_name: formData.email || 'Demo Employee',
          role: shift.role,
          shift_date: shift.date,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save request')
      }

      await loadRequests()
      setMessage('Coverage request saved successfully.')
    } catch (error) {
      console.error(error)
      setMessage('Error saving coverage request.')
    }
  }

  if (!signedIn) {
    return (
      <div className={`app-shell ${isDark ? 'dark' : 'light'}`}>
        <div className="theme-toggle-wrap">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setIsDark((current) => !current)}
            aria-label="Toggle dark mode"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="login-card">
          <aside className="brand-panel">
            <div className="brand-mark">C</div>
            <div className="brand-copy">
              <span className="eyebrow">Welcome back</span>
              <h1>CoverLoop</h1>
            </div>

            <div className="feature-box">
              <p className="feature-label">Productivity</p>
              <h2>Everything in one place</h2>
              <ul>
                <li>Track schedules with ease</li>
                <li>Manage team updates instantly</li>
                <li>Stay on top of your work</li>
              </ul>
            </div>
          </aside>

          <main className="login-panel">
            <div className="panel-header">
              <span className="mini-badge">secure access</span>
              <h2>Sign in</h2>
              <p>Use your account details to continue.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </label>

              <label className="field">
                <span>Access code</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={DEMO_ACCESS_CODE}
                  autoComplete="current-password"
                />
              </label>

              <div className="demo-code-hint">Demo access code: <strong>{DEMO_ACCESS_CODE}</strong></div>

              <div className="form-row">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#!">Forgot password?</a>
              </div>

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {message && <div className="status-message">{message}</div>}

            <div className="divider"><span>or continue with</span></div>

            <div className="alt-actions">
              <button type="button">Google</button>
              <button type="button">GitHub</button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-shell ${isDark ? 'dark' : 'light'}`}>
      <div className="app dashboard-app">
        <aside className="sidebar">
          <h2>↻ CoverLoop</h2>
          <p className="sidebar-subtitle">Shift Management</p>

          {['Dashboard', 'My Shifts', 'Coverage Requests'].map((item) => (
            <button
              key={item}
              className={activePage === item ? 'nav active' : 'nav'}
              onClick={() => {
                setActivePage(item)
                setMessage('')
              }}
            >
              {item}
            </button>
          ))}

          <button
            type="button"
            className="nav logout-btn"
            onClick={() => {
              setSignedIn(false)
              setMessage('')
              setFormData((current) => ({ ...current, password: '' }))
            }}
          >
            Log out
          </button>
        </aside>

        <main className="main">
          <header className="topbar">
            <div>
              <h1>{activePage}</h1>
              <p>Manage your shifts and coverage requests</p>
            </div>
            <div className="topbar-actions">
              <button
                type="button"
                className="theme-toggle light-theme-toggle"
                onClick={() => setIsDark((current) => !current)}
                aria-label="Toggle dark mode"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <div className="avatar">CL</div>
            </div>
          </header>

          {message && <div className="notice">{message}</div>}

          {loading && activePage === 'Dashboard' && <div className="notice">Loading updates...</div>}

          {activePage === 'Dashboard' && (
            <>
              <div className="stats">
                <div className="stat">
                  <span>My Shifts</span>
                  <h2>{shifts.length}</h2>
                </div>
                <div className="stat">
                  <span>Open Requests</span>
                  <h2>{requests.filter((request) => request.status === 'Pending').length}</h2>
                </div>
                <div className="stat">
                  <span>Covered Shifts</span>
                  <h2>{requests.filter((request) => request.status === 'Approved').length}</h2>
                </div>
              </div>

              <section className="panel">
                <h2>Welcome to CoverLoop</h2>
                <p>
                  CoverLoop helps casual and part-time employees manage shifts and request coverage from coworkers.
                </p>
                <button className="primary" onClick={() => setActivePage('My Shifts')}>
                  View My Shifts →
                </button>
              </section>

              <section className="panel">
                <h2>Upcoming Shifts</h2>
                {shifts.slice(0, 2).map((shift) => (
                  <div className="shift" key={shift.id}>
                    <div>
                      <strong>{shift.day}, {shift.date}</strong>
                      <p>{shift.role} • {shift.time}</p>
                    </div>
                    <span className="status">{shift.status}</span>
                  </div>
                ))}
              </section>
            </>
          )}

          {activePage === 'My Shifts' && (
            <section className="panel">
              <h2>My Upcoming Shifts</h2>
              <p>Request coverage if you cannot attend a shift.</p>

              {shifts.map((shift) => (
                <div className="shift" key={shift.id}>
                  <div>
                    <strong>{shift.day}, {shift.date}</strong>
                    <p>{shift.role}</p>
                    <p>{shift.time}</p>
                    <span className="status">{shift.status}</span>
                  </div>
                  <button
                    className="primary"
                    disabled={shift.status !== 'Scheduled'}
                    onClick={() => requestCoverage(shift)}
                  >
                    Request Coverage
                  </button>
                </div>
              ))}
            </section>
          )}

          {activePage === 'Coverage Requests' && (
            <section className="panel">
              <h2>My Coverage Requests</h2>

              {requests.length === 0 ? (
                <p>No coverage requests yet.</p>
              ) : (
                requests.map((request) => (
                  <div className="shift" key={request.id}>
                    <div>
                      <strong>{request.role} — {request.shift_date}</strong>
                      <p>Request #{request.id}</p>
                    </div>
                    <span className="status">{request.status}</span>
                  </div>
                ))
              )}
            </section>
          )}

          <footer>CoverLoop © 2026 | Shift Coverage Management</footer>
        </main>
      </div>
    </div>
  )
}

export default App
