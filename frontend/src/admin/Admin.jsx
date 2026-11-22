
import { useEffect, useState } from 'react'

const ADMIN_API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin`

// =====================================
// SHARED ADMIN THEME TOGGLE
// =====================================

function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('spa-theme') || 'dark'
  )

  useEffect(() => {
    localStorage.setItem('spa-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <button
      type="button"
      className="theme-toggle admin-theme-toggle"
      onClick={() =>
        setTheme((current) =>
          current === 'dark' ? 'light' : 'dark'
        )
      }
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}

// =====================================
// ADMIN LOGIN AND DASHBOARD
// =====================================

function Admin() {
  const [admin, setAdmin] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const [bookings, setBookings] = useState([])
  const [therapists, setTherapists] = useState([])
  const [newTherapist, setNewTherapist] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)
  const [therapistsLoading, setTherapistsLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  async function checkAdmin() {
    try {
      const response = await fetch(`${ADMIN_API}/me`, {
        credentials: 'include',
      })

      if (!response.ok) {
        setAdmin(null)
        return
      }

      const data = await response.json()
      setAdmin(data.admin)
    } catch {
      setError('Unable to connect to the server.')
    }
  }

  async function fetchBookings() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${ADMIN_API}/bookings`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load bookings.')
      }

      setBookings(data.bookings || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTherapists() {
    setTherapistsLoading(true)

    try {
      const response = await fetch(`${ADMIN_API}/therapists`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load therapists.')
      }

      setTherapists(data.therapists || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setTherapistsLoading(false)
    }
  }

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (admin) {
      fetchBookings()
      fetchTherapists()
    }
  }, [admin])

  async function handleLogin(event) {
    event.preventDefault()
    setLoginLoading(true)
    setError('')

    try {
      const response = await fetch(`${ADMIN_API}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.')
      }

      setAdmin(data.admin)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  // Request a password reset email.
  async function handleForgotPassword(event) {
    event.preventDefault()
    setForgotLoading(true)
    setForgotMessage('')
    setError('')

    try {
      const response = await fetch(`${ADMIN_API}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to process your request.')
      }

      setForgotMessage(
        data.message ||
        'If an account with that email exists, a password reset link will be sent.'
      )
    } catch (err) {
      setForgotMessage(err.message)
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${ADMIN_API}/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      setAdmin(null)
      setBookings([])
      setTherapists([])
      setUsername('')
      setPassword('')
      setError('')
    } catch {
      setError('Unable to log out. Please try again.')
    }
  }

  async function updateStatus(bookingId, status) {
    setUpdatingId(bookingId)
    setError('')

    try {
      const response = await fetch(`${ADMIN_API}/bookings/${bookingId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update booking.')
      }

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId ? data.booking : booking
        )
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function addTherapist(event) {
    event.preventDefault()

    const name = newTherapist.trim()

    if (!name) {
      setError('Please enter a therapist name.')
      return
    }

    setError('')

    try {
      const response = await fetch(`${ADMIN_API}/therapists`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to add therapist.')
      }

      setNewTherapist('')
      await fetchTherapists()
    } catch (err) {
      setError(err.message)
    }
  }

  async function updateTherapist(therapistId, changes) {
    setError('')

    try {
      const response = await fetch(
        `${ADMIN_API}/therapists/${therapistId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update therapist.')
      }

      setTherapists((previous) =>
        previous.map((therapist) =>
          therapist.id === therapistId ? data.therapist : therapist
        )
      )

      setEditingId(null)
      setEditingName('')
    } catch (err) {
      setError(err.message)
    }
  }

  const pendingCount = bookings.filter(
    (booking) => booking.status === 'pending'
  ).length

  const confirmedCount = bookings.filter(
    (booking) => booking.status === 'confirmed'
  ).length

  const completedCount = bookings.filter(
    (booking) => booking.status === 'completed'
  ).length

  const cancelledCount = bookings.filter(
    (booking) => booking.status === 'cancelled'
  ).length

  // =====================================
  // FORGOT PASSWORD SCREEN
  // =====================================

  if (!admin && forgotMode) {
    return (
      <main className="admin-page">
        <div className="admin-theme-control">
          <ThemeToggle />
        </div>

        <form
          className="admin-login"
          onSubmit={handleForgotPassword}
        >
          <p className="eyebrow">SARAH GOLD SPA</p>

          <h1>Forgot Password?</h1>

          <p>
            Enter the email address registered to your administrator
            account. We will send you a password reset link.
          </p>

          {forgotMessage && (
            <p className="admin-success">
              {forgotMessage}
            </p>
          )}

          <label htmlFor="forgot-email">
            Registered Email Address
          </label>

          <input
            id="forgot-email"
            type="email"
            value={forgotEmail}
            onChange={(event) => setForgotEmail(event.target.value)}
            placeholder="Enter your registered email"
            autoComplete="email"
            required
          />

          <button type="submit" disabled={forgotLoading}>
            {forgotLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <button
            type="button"
            onClick={() => {
              setForgotMode(false)
              setForgotMessage('')
              setForgotEmail('')
            }}
          >
            Back to Login
          </button>

          <a href="/">Back to website</a>
        </form>
      </main>
    )
  }

  // =====================================
  // ADMIN LOGIN SCREEN
  // =====================================

  if (!admin) {
    return (
      <main className="admin-page">
        <div className="admin-theme-control">
          <ThemeToggle />
        </div>

        <form className="admin-login" onSubmit={handleLogin}>
          <p className="eyebrow">SARAH GOLD SPA</p>

          <h1>Welcome Back</h1>

          <p>Sign in to manage your spa bookings.</p>

          {error && <p className="admin-error">{error}</p>}

          <label htmlFor="admin-username">Username</label>

          <input
            id="admin-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter username"
            autoComplete="username"
            required
          />

          <label htmlFor="admin-password">Password</label>

          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={loginLoading}>
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            className="forgot-password-link"
            onClick={() => {
              setForgotMode(true)
              setError('')
            }}
          >
            Forgot Password?
          </button>

          <a href="/">Back to website</a>
        </form>
      </main>
    )
  }

  // =====================================
  // ADMIN DASHBOARD
  // =====================================

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">SARAH GOLD SPA</p>
          <h1>Booking Management</h1>
          <p>Welcome, {admin.username}</p>
        </div>

        <div className="admin-actions">
          <ThemeToggle />

          <button
            onClick={() => {
              fetchBookings()
              fetchTherapists()
            }}
            disabled={loading || therapistsLoading}
          >
            Refresh
          </button>

          <button className="admin-logout" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      <section className="admin-stats">
        <article>
          <span>Total Bookings</span>
          <strong>{bookings.length}</strong>
        </article>

        <article>
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </article>

        <article>
          <span>Confirmed</span>
          <strong>{confirmedCount}</strong>
        </article>

        <article>
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </article>

        <article>
          <span>Cancelled</span>
          <strong>{cancelledCount}</strong>
        </article>
      </section>

      {error && <p className="admin-error">{error}</p>}

      {/* THERAPIST MANAGEMENT */}

      <section className="admin-therapists">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">OUR TEAM</p>
            <h2>Therapist Management</h2>
          </div>

          <span>{therapists.length} therapists</span>
        </div>

        <form className="therapist-add-form" onSubmit={addTherapist}>
          <input
            type="text"
            value={newTherapist}
            onChange={(event) => setNewTherapist(event.target.value)}
            placeholder="Enter new therapist name"
            maxLength={100}
          />

          <button type="submit">+ Add Therapist</button>
        </form>

        {therapistsLoading && (
          <p className="admin-empty">Loading therapists...</p>
        )}

        {!therapistsLoading && therapists.length === 0 && (
          <p className="admin-empty">No therapists found.</p>
        )}

        <div className="therapist-grid">
          {therapists.map((therapist) => (
            <article className="therapist-card" key={therapist.id}>
              {editingId === therapist.id ? (
                <div className="therapist-edit">
                  <input
                    value={editingName}
                    onChange={(event) =>
                      setEditingName(event.target.value)
                    }
                    maxLength={100}
                    autoFocus
                  />

                  <button
                    onClick={() =>
                      updateTherapist(therapist.id, {
                        name: editingName.trim(),
                      })
                    }
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setEditingName('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="therapist-card-heading">
                    <h3>{therapist.name}</h3>

                    <span
                      className={
                        therapist.is_active
                          ? 'therapist-active'
                          : 'therapist-inactive'
                      }
                    >
                      {therapist.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p>Therapist #{therapist.id}</p>

                  <div className="therapist-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(therapist.id)
                        setEditingName(therapist.name)
                      }}
                    >
                      Rename
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateTherapist(therapist.id, {
                          is_active: !therapist.is_active,
                        })
                      }
                    >
                      {therapist.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* CUSTOMER BOOKINGS */}

      <section className="admin-bookings">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">RESERVATIONS</p>
            <h2>Customer Bookings</h2>
          </div>

          <span>{bookings.length} total</span>
        </div>

        {loading && (
          <p className="admin-empty">Loading bookings...</p>
        )}

        {!loading && bookings.length === 0 && (
          <p className="admin-empty">
            No bookings have been received yet.
          </p>
        )}

        <div className="admin-booking-grid">
          {bookings.map((booking) => (
            <article className="admin-booking-card" key={booking.id}>
              <div className="admin-booking-top">
                <h3>Booking #{booking.id}</h3>

                <span className={`status-${booking.status}`}>
                  {booking.status}
                </span>
              </div>

              <div className="admin-customer">
                <span className="admin-detail-label">CUSTOMER</span>
                <strong>{booking.customer_name}</strong>
                <a href={`tel:${booking.phone}`}>{booking.phone}</a>
              </div>

              <div className="admin-detail">
                <span className="admin-detail-label">TREATMENTS</span>

                <p>
                  {booking.services?.map((service) => service.name).join(', ')
                    || booking.service
                    || 'No treatment specified'}
                </p>
              </div>

              <div className="admin-detail-grid">
                <div className="admin-detail">
                  <span className="admin-detail-label">
                    APPOINTMENT DATE
                  </span>
                  <p>{booking.appointment_date}</p>
                </div>

                <div className="admin-detail">
                  <span className="admin-detail-label">TIME</span>
                  <p>{booking.appointment_time}</p>
                </div>

                <div className="admin-detail">
                  <span className="admin-detail-label">THERAPIST</span>
                  <p>{booking.therapist || 'Not assigned'}</p>
                </div>

                <div className="admin-detail">
                  <span className="admin-detail-label">DURATION</span>
                  <p>
                    {booking.total_duration_minutes || 0} minutes
                  </p>
                </div>
              </div>

              <div className="admin-price">
                <span>Total price</span>

                <strong>
                  KSh {Number(booking.total_price || 0).toLocaleString('en-KE')}
                </strong>
              </div>

              <div className="admin-notes">
                <span className="admin-detail-label">
                  CUSTOMER MESSAGE / SPECIAL REQUESTS
                </span>

                <p>{booking.notes || 'No additional notes.'}</p>
              </div>

              <div className="admin-status-control">
                <label htmlFor={`status-${booking.id}`}>
                  Update booking status
                </label>

                <select
                  id={`status-${booking.id}`}
                  value={booking.status}
                  disabled={updatingId === booking.id}
                  onChange={(event) =>
                    updateStatus(booking.id, event.target.value)
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {updatingId === booking.id && (
                  <small>Saving status...</small>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <a className="admin-back" href="/">
        ← Back to main website
      </a>
    </main>
  )
}

// =====================================
// RESET PASSWORD PAGE
// =====================================

export function ResetPassword() {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  }, [])

  async function handleResetPassword(event) {
    event.preventDefault()

    setError('')
    setMessage('')

    if (password.length < 12) {
      setError('Your password must contain at least 12 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${ADMIN_API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reset your password.')
      }

      setSuccess(true)
      setMessage(data.message || 'Password reset successfully.')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-theme-control">
        <ThemeToggle />
      </div>

      <form
        className="admin-login"
        onSubmit={handleResetPassword}
      >
        <p className="eyebrow">SARAH GOLD SPA</p>

        <h1>Reset Password</h1>

        {!token ? (
          <>
            <p className="admin-error">
              This password reset link is missing its token.
              Please request a new reset link.
            </p>

            <a href="/admin">Back to Admin Login</a>
          </>
        ) : success ? (
          <>
            <p className="admin-success">{message}</p>

            <a href="/admin">Go to Admin Login</a>
          </>
        ) : (
          <>
            <p>
              Create a new password for your administrator account.
              Use at least 12 characters.
            </p>

            {error && <p className="admin-error">{error}</p>}

            <label htmlFor="new-password">New Password</label>

            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              minLength={12}
              required
            />

            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Enter password again"
              autoComplete="new-password"
              minLength={12}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </>
        )}
      </form>
    </main>
  )
}

export default Admin

