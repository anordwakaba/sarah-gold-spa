
from datetime import date
from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models import Booking, Service


# Create the bookings blueprint
bookings_bp = Blueprint(
    "bookings",
    __name__,
    url_prefix="/api/bookings"
)


@bookings_bp.route("", methods=["POST"])
def create_booking():
    """
    Receive and save a customer appointment request.
    """

    # Get booking information from the frontend
    data = request.get_json(silent=True) or {}

    customer_name = data.get("customer_name", "").strip()
    phone = data.get("phone", "").strip()
    service_id = data.get("service_id")
    appointment_date = data.get("appointment_date", "").strip()
    appointment_time = data.get("appointment_time", "").strip()
    notes = data.get("notes", "").strip()

    # Check required fields
    if not all([
        customer_name,
        phone,
        service_id,
        appointment_date,
        appointment_time
    ]):
        return jsonify({
            "error": "Please fill in all required fields."
        }), 400

    # Validate service ID
    try:
        service_id = int(service_id)
    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid service selected."
        }), 400

    # Check whether the selected service exists
    service = db.session.get(Service, service_id)

    if not service:
        return jsonify({
            "error": "The selected service does not exist."
        }), 404

    # Validate appointment date
    try:
        parsed_date = date.fromisoformat(appointment_date)
    except ValueError:
        return jsonify({
            "error": "Invalid appointment date. Use YYYY-MM-DD."
        }), 400

    if parsed_date < date.today():
        return jsonify({
            "error": "Appointment date cannot be in the past."
        }), 400

    # Create a new booking
    booking = Booking(
        customer_name=customer_name,
        phone=phone,
        service_id=service_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        notes=notes
    )

    try:
        db.session.add(booking)
        db.session.commit()

        return jsonify({
            "message": "Your appointment request has been received!",
            "booking": booking.to_dict()
        }), 201

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Unable to save your booking. Please try again."
        }), 500
