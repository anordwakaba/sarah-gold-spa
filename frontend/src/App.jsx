
import { useEffect, useState } from 'react'
import './App.css'
import Admin, { ResetPassword } from './admin/Admin.jsx'

import swedishImage from './assets/treatments/pexels-tima-miroshnichenko-6187270.jpg'
import deepTissueImage from './assets/treatments/pexels-tima-miroshnichenko-6186755.jpg'
import bodyToBodyImage from './assets/treatments/pexels-jonathanborba-27684599.jpg'
import thaiImage from './assets/treatments/pexels-tima-miroshnichenko-6187267.jpg'
import fourHandsImage from './assets/treatments/pexels-tima-miroshnichenko-6188032.jpg'
import scrubImage from './assets/treatments/pexels-koolshooters-6628656.jpg'
import backImage from './assets/treatments/pexels-shkrabaanthony-6076140.jpg'
import reflexologyImage from './assets/treatments/pexels-dmitry-ovsyannikov-271243380-32729955.jpg'
import sportsImage from './assets/treatments/pexels-recovery-sport-center-2147880161-29807421.jpg'
import couplesImage from './assets/treatments/pexels-jonathanborba-19641806.jpg'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const API_URL = `${API_BASE_URL}/api/services`
const BOOKING_API_URL = `${API_BASE_URL}/api/bookings`

const WHATSAPP_NUMBER = '254798778025'

function getTreatmentImage(serviceName) {
  const name = serviceName.toLowerCase()

  if (name.includes('swedish')) return swedishImage
  if (name.includes('deep tissue')) return deepTissueImage
  if (name.includes('body to body')) return bodyToBodyImage
  if (name.includes('thai')) return thaiImage
  if (name.includes('four hands')) return fourHandsImage
  if (name.includes('scrub')) return scrubImage
  if (name.includes('back')) return backImage
  if (name.includes('reflexology')) return reflexologyImage
  if (name.includes('sports')) return sportsImage
  if (name.includes('couples')) return couplesImage
  if (name.includes('home') || name.includes('hotel')) return swedishImage

  return swedishImage
}

const navigation = [
  { label: 'Home', href: '#home' },
  { label: 'Our Story', href: '#about' },
  { label: 'Treatments', href: '#services' },
  { label: 'Contact', href: '#contact' },
]

const highlights = [
  {
    number: '01',
    title: 'Personalised Care',
    description: 'Treatments tailored to your relaxation and wellness needs.',
  },
  {
    number: '02',
    title: 'A Peaceful Escape',
    description: 'Take a break from everyday life and enjoy time for yourself.',
  },
  {
    number: '03',
    title: 'Professional Service',
    description: 'Enjoy attentive care throughout your spa experience.',
  },
]

function App() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Booking form information
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedServiceIds, setSelectedServiceIds] = useState([])
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState(false)

  // Today's date for the appointment date field
  const today = new Date()
  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  // Fetch treatments from Flask
  useEffect(() => {
    const controller = new AbortController()

    async function fetchServices() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(API_URL, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load treatments. Please try again.')
        }

        const data = await response.json()
        const serviceList = Array.isArray(data) ? data : data.services

        if (!Array.isArray(serviceList)) {
          throw new Error('The server returned an unexpected response.')
        }

        setServices(serviceList)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong while loading treatments.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchServices()

    return () => controller.abort()
  }, [])

  // Add or remove a treatment from the selection
  function handleServiceSelection(serviceId) {
    setSelectedServiceIds((previous) => {
      if (previous.includes(String(serviceId))) {
        return previous.filter((id) => id !== String(serviceId))
      }

      return [...previous, String(serviceId)]
    })
  }

  // Prepare a WhatsApp message using the booking details
  const selectedServices = services.filter((service) =>
    selectedServiceIds.includes(String(service.id))
  )

  const whatsappMessage = [
    'Hello Sarah Gold Spa!',
    '',
    'I would like to make a booking.',
    `Name: ${customerName || 'Not provided'}`,
    `Phone: ${phone || 'Not provided'}`,
    `Treatments: ${
      selectedServices.length
        ? selectedServices.map((service) => service.name).join(', ')
        : 'Not selected yet'
    }`,
    `Date: ${appointmentDate || 'Not selected yet'}`,
    `Time: ${appointmentTime || 'Not selected yet'}`,
    `Additional notes: ${notes || 'None'}`,
  ].join('\n')

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`

  // Submit website booking to Flask
  async function handleBookingSubmit(event) {
    event.preventDefault()

    setSubmitting(true)
    setBookingMessage('')
    setBookingError(false)

    try {
      const response = await fetch(BOOKING_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: customerName,
          phone,
          service_ids: selectedServiceIds.map(Number),
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to complete your booking.')
      }

      setBookingMessage(
        'Your booking request has been received successfully! We look forward to welcoming you.'
      )

      setBookingError(false)

      // Clear the form after a successful booking
      setCustomerName('')
      setPhone('')
      setSelectedServiceIds([])
      setAppointmentDate('')
      setAppointmentTime('')
      setNotes('')
    } catch (err) {
      setBookingMessage(
        err.message || 'Something went wrong. Please try again.'
      )
      setBookingError(true)
    } finally {
      setSubmitting(false)
    }
  }

  // Admin login page
  if (window.location.pathname === '/admin') {
    return <Admin />
  }

  // Password reset page
  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />
  }

  return (
    <main>
      {/* Navigation */}
      <header className="navbar">
        <a href="#home" className="brand" aria-label="Sarah Gold Spa home">
          <span className="brand-name">SARAH GOLD</span>
          <span className="brand-subtitle">SPA & WELLNESS</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          {navigation.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Sarah Gold Spa! I would like to make a booking.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="nav-booking"
        >
          WhatsApp Booking
        </a>
      </header>

      {/* Hero */}
      <section className="hero-section" id="home">
        <div className="hero-content">
          <p className="eyebrow">WELCOME TO SARAH GOLD SPA</p>

          <h1>
            Discover the Art
            <br />
            of <span>Relaxation.</span>
          </h1>

          <p className="hero-description">
            Escape the everyday and experience a world of calm.
            Enjoy personalised massage and wellness treatments
            in a peaceful, welcoming environment.
          </p>

          <div className="hero-actions">
            <a href="#booking" className="primary-button">
              Book Online
            </a>

            <a href="#services" className="secondary-button">
              Explore Treatments
            </a>
          </div>

          <div className="hero-note">
            <span className="gold-line" />
            <span>A moment of calm. A feeling of renewal.</span>
          </div>
        </div>

        <div className="hero-image-caption">
          <span>YOUR WELLNESS JOURNEY BEGINS HERE</span>
        </div>
      </section>

      {/* Welcome section */}
      <section className="about-section" id="about">
        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=85"
            alt="Peaceful luxury spa interior"
          />
        </div>

        <div className="about-content">
          <p className="eyebrow">WELCOME TO YOUR SANCTUARY</p>

          <h2>
            More than a treatment.
            <span> An experience.</span>
          </h2>

          <p>
            At Sarah Gold Spa, we believe that taking care of yourself
            is an essential part of living well. Our spa offers a
            welcoming space where you can slow down, relax and
            enjoy personalised wellness care.
          </p>

          <a href="#services" className="text-link">
            Discover our treatments →
          </a>
        </div>
      </section>

      {/* Experience highlights */}
      <section className="highlights-section">
        <div className="section-heading">
          <p className="eyebrow">THE SARAH GOLD EXPERIENCE</p>
          <h2>Wellness with a personal touch.</h2>
        </div>

        <div className="highlights-grid">
          {highlights.map((item) => (
            <article className="highlight-card" key={item.number}>
              <span className="highlight-number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Treatments */}
      <section className="services-section" id="services">
        <div className="section-heading">
          <p className="eyebrow">RELAX, REFRESH, RENEW</p>
          <h2>Explore Our Treatments</h2>
          <p>
            Find a treatment that suits your needs and make time
            for the relaxation you deserve.
          </p>
        </div>

        {loading && (
          <p className="services-message">Loading our treatments...</p>
        )}

        {error && (
          <div className="services-message services-error">
            <p>{error}</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <p className="services-message">
            No treatments are currently available.
          </p>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service.id}>
                <img
                  src={getTreatmentImage(service.name)}
                  alt={`${service.name} treatment at Sarah Gold Spa`}
                  className="service-image"
                />

                <div className="service-card-content">
                  <span className="service-duration">
                    {service.duration}
                  </span>

                  <h3>{service.name}</h3>

                  <p>{service.description}</p>

                  <div className="service-card-bottom">
                    <span className="service-price">
                      KSh {Number(service.price).toLocaleString('en-KE')}
                    </span>

                    <a href="#booking" className="service-book-link">
                      Book treatment →
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Booking form */}
      <section className="booking-section" id="booking">
        <p className="eyebrow">MAKE TIME FOR YOURSELF</p>

        <h2>Book Your Experience</h2>

        <p>
          Book directly through our website or contact us on WhatsApp.
          We look forward to welcoming you.
        </p>

        <form className="booking-form" onSubmit={handleBookingSubmit}>
          <div className="booking-field">
            <label htmlFor="customer-name">Your full name *</label>
            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="booking-field">
            <label htmlFor="customer-phone">Phone number *</label>
            <input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g. 07XX XXX XXX"
              required
            />
          </div>

          <div className="booking-field booking-services">
            <label>Select your treatments *</label>

            <p className="booking-hint">
              You can select more than one treatment.
            </p>

            {services.map((service) => (
              <label className="booking-service-option" key={service.id}>
                <input
                  type="checkbox"
                  checked={selectedServiceIds.includes(String(service.id))}
                  onChange={() => handleServiceSelection(service.id)}
                />

                <span>
                  {service.name} — KSh{' '}
                  {Number(service.price).toLocaleString('en-KE')}
                </span>
              </label>
            ))}

            {selectedServiceIds.length > 0 && (
              <p className="booking-selection-total">
                Selected treatments: {selectedServiceIds.length}
              </p>
            )}
          </div>

          <div className="booking-field">
            <label htmlFor="appointment-date">Appointment date *</label>
            <input
              id="appointment-date"
              type="date"
              min={minimumDate}
              value={appointmentDate}
              onChange={(event) => setAppointmentDate(event.target.value)}
              required
            />
          </div>

          <div className="booking-field">
            <label htmlFor="appointment-time">Appointment time *</label>
            <input
              id="appointment-time"
              type="time"
              value={appointmentTime}
              onChange={(event) => setAppointmentTime(event.target.value)}
              required
            />
          </div>

          <div className="booking-field">
            <label htmlFor="booking-notes">Additional notes (optional)</label>
            <textarea
              id="booking-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Any special requests?"
              rows="4"
            />
          </div>

          {bookingMessage && (
            <p
              className={
                bookingError
                  ? 'booking-feedback booking-feedback-error'
                  : 'booking-feedback booking-feedback-success'
              }
              role="status"
            >
              {bookingMessage}
            </p>
          )}

          <button
            type="submit"
            className="primary-button booking-submit"
            disabled={submitting || loading || services.length === 0}
          >
            {submitting ? 'Submitting your booking...' : 'Confirm Website Booking'}
          </button>

          <div className="booking-divider">
            <span>OR BOOK THROUGH</span>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-booking-button"
          >
            <span>WhatsApp</span>
            <span>Chat with us directly →</span>
          </a>

          <p className="booking-phone">
            WhatsApp: +254 798778025
          </p>
        </form>
      </section>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="footer-brand">
          <a href="#home" className="brand">
            <span className="brand-name">SARAH GOLD</span>
            <span className="brand-subtitle">SPA & WELLNESS</span>
          </a>

          <p>Your destination for relaxation and wellness.</p>
        </div>

        <div className="footer-links">
          <h3>Explore</h3>
          <a href="#home">Home</a>
          <a href="#about">Our Story</a>
          <a href="#services">Treatments</a>
          <a href="#booking">Book Appointment</a>
        </div>

        <div className="footer-contact">
          <h3>Get in Touch</h3>
          <p>We would love to hear from you.</p>
          <p>+254 798778025</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact us on WhatsApp
          </a>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} Sarah Gold Spa. All rights reserved.
        </p>
      </footer>
    </main>
  )
}

export default App
