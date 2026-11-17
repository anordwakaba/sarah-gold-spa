
from datetime import date, datetime
from zoneinfo import ZoneInfo

from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models import Booking, Service, Therapist


bookings_bp = Blueprint(
    "bookings",
    __name__,
    url_prefix="/api/bookings"
)

KENYA_TIMEZONE = ZoneInfo("Africa/Nairobi")


def get_booking_datetime(appointment_date, appointment_time):
    """Convert appointment date and time into Kenya time."""

    parsed_date = date.fromisoformat(appointment_date)
    parsed_time = datetime.strptime(
        appointment_time, "%H:%M"
    ).time()

    return datetime.combine(
        parsed_date,
        parsed_time,
        tzinfo=KENYA_TIMEZONE
    )


def therapist_is_available(therapist, start_time, end_time):
    """Check whether a therapist has another appointment."""

    existing_bookings = Booking.query.filter(
        Booking.therapist_id == therapist.id,
        Booking.status.in_(["pending", "confirmed"])
    ).all()

    for booking in existing_bookings:
        try:
            existing_start = get_booking_datetime(
                booking.appointment_date,
                booking.appointment_time
            )

            existing_end = datetime.fromtimestamp(
                existing_start.timestamp()
                + booking.total_duration_minutes * 60,
                tz=KENYA_TIMEZONE
            )

        except (ValueError, TypeError):
            continue

        if start_time < existing_end and end_time > existing_start:
            return False

    return True


@bookings_bp.route("", methods=["POST"])
def create_booking():
    """Receive and save a customer appointment request."""

    data = request.get_json(silent=True) or {}

    customer_name = str(data.get("customer_name") or "").strip()
    phone = str(data.get("phone") or "").strip()
    appointment_date = str(data.get("appointment_date") or "").strip()
    appointment_time = str(data.get("appointment_time") or "").strip()
    notes = str(data.get("notes") or "").strip()

    # Support multiple services and the old single-service format.
    service_ids = data.get("service_ids")

    if service_ids is None:
        single_service_id = data.get("service_id")
        service_ids = [single_service_id] if single_service_id else []

    # Validate required fields.
    if not all([
        customer_name,
        phone,
        appointment_date,
        appointment_time
    ]):
        return jsonify({
            "error": "Please fill in all required fields."
        }), 400

    if not isinstance(service_ids, list) or not service_ids:
        return jsonify({
            "error": "Please select at least one service."
        }), 400

    # Validate service IDs.
    try:
        service_ids = [int(item) for item in service_ids]
    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid service selection."
        }), 400

    if len(service_ids) != len(set(service_ids)):
        return jsonify({
            "error": "You cannot select the same service more than once."
        }), 400

    # Validate appointment date and time.
    try:
        start_time = get_booking_datetime(
            appointment_date,
            appointment_time
        )
    except ValueError:
        return jsonify({
            "error": "Use a valid date (YYYY-MM-DD) and time (HH:MM)."
        }), 400

    if start_time <= datetime.now(KENYA_TIMEZONE):
        return jsonify({
            "error": "Please select a future appointment time."
        }), 400

    # Retrieve all selected services.
    services = Service.query.filter(
        Service.id.in_(service_ids)
    ).all()

    if len(services) != len(service_ids):
        return jsonify({
            "error": "One or more selected services do not exist."
        }), 404

    # Calculate total duration.
    total_duration = sum(
        service.duration_minutes for service in services
    )

    if total_duration <= 0:
        return jsonify({
            "error": "A selected service has an invalid duration."
        }), 400

    # Calculate when the appointment will finish.
    end_time = datetime.fromtimestamp(
        start_time.timestamp() + total_duration * 60,
        tz=KENYA_TIMEZONE
    )

    # Get all active therapists.
    therapists = Therapist.query.filter_by(
        is_active=True
    ).order_by(Therapist.id).all()

    if not therapists:
        return jsonify({
            "error": "There are currently no active therapists."
        }), 409

    # Assign one therapist for the entire booking.
    assigned_therapist = None

    for therapist in therapists:
        if therapist_is_available(
            therapist,
            start_time,
            end_time
        ):
            assigned_therapist = therapist
            break

    if assigned_therapist is None:
        return jsonify({
            "error": "No therapist is available at that time. Please choose another time."
        }), 409

    # Create the booking with all selected services.
    booking = Booking(
        customer_name=customer_name,
        phone=phone,
        service_id=services[0].id,
        therapist_id=assigned_therapist.id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        notes=notes,
        services=services
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
