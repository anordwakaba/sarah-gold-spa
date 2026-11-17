 
from functools import wraps

from flask import Blueprint, jsonify, request, session

from app.extensions import db
from app.models import Admin, Booking, Therapist


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


def admin_required(function):
    """Allow access only to authenticated administrators."""

    @wraps(function)
    def decorated_function(*args, **kwargs):
        admin_id = session.get("admin_id")

        if not admin_id or not db.session.get(Admin, admin_id):
            return jsonify({
                "error": "Authentication required."
            }), 401

        return function(*args, **kwargs)

    return decorated_function


@admin_bp.route("/login", methods=["POST"])
def admin_login():
    """Log in an administrator."""

    data = request.get_json(silent=True) or {}

    username = data.get("username")
    password = data.get("password")

    if not isinstance(username, str) or not isinstance(password, str):
        return jsonify({
            "error": "Username and password are required."
        }), 400

    username = username.strip()

    if not username or not password:
        return jsonify({
            "error": "Username and password are required."
        }), 400

    admin = Admin.query.filter_by(username=username).first()

    if not admin or not admin.check_password(password):
        return jsonify({
            "error": "Invalid username or password."
        }), 401

    session.clear()
    session["admin_id"] = admin.id

    return jsonify({
        "message": "Admin login successful.",
        "admin": {
            "id": admin.id,
            "username": admin.username
        }
    }), 200


@admin_bp.route("/me", methods=["GET"])
@admin_required
def current_admin():
    """Return the currently logged-in administrator."""

    admin = db.session.get(Admin, session["admin_id"])

    return jsonify({
        "admin": {
            "id": admin.id,
            "username": admin.username
        }
    }), 200


@admin_bp.route("/logout", methods=["POST"])
def admin_logout():
    """Log out the administrator."""

    session.clear()

    return jsonify({
        "message": "Admin logged out successfully."
    }), 200


@admin_bp.route("/bookings", methods=["GET"])
@admin_required
def get_all_bookings():
    """Allow administrators to view all customer bookings."""

    bookings = Booking.query.order_by(
        Booking.created_at.desc()
    ).all()

    return jsonify({
        "count": len(bookings),
        "bookings": [
            booking.to_dict()
            for booking in bookings
        ]
    }), 200


@admin_bp.route("/bookings/<int:booking_id>", methods=["PATCH"])
@admin_required
def update_booking_status(booking_id):
    """Allow administrators to update a booking's status."""

    data = request.get_json(silent=True) or {}
    status = data.get("status")

    allowed_statuses = [
        "pending",
        "confirmed",
        "completed",
        "cancelled"
    ]

    if not isinstance(status, str) or status not in allowed_statuses:
        return jsonify({
            "error": "Invalid status. Choose pending, confirmed, completed, or cancelled."
        }), 400

    booking = db.session.get(Booking, booking_id)

    if not booking:
        return jsonify({
            "error": "Booking not found."
        }), 404

    booking.status = status

    try:
        db.session.commit()

        return jsonify({
            "message": "Booking status updated successfully.",
            "booking": booking.to_dict()
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Unable to update booking status."
        }), 500


# -----------------------------
# THERAPIST MANAGEMENT
# -----------------------------

@admin_bp.route("/therapists", methods=["GET"])
@admin_required
def get_therapists():
    """Allow administrators to view all therapists."""

    therapists = Therapist.query.order_by(
        Therapist.id.asc()
    ).all()

    return jsonify({
        "count": len(therapists),
        "therapists": [
            {
                "id": therapist.id,
                "name": therapist.name,
                "is_active": therapist.is_active
            }
            for therapist in therapists
        ]
    }), 200


@admin_bp.route("/therapists", methods=["POST"])
@admin_required
def add_therapist():
    """Allow administrators to add new therapists."""

    data = request.get_json(silent=True) or {}
    name = data.get("name")

    if not isinstance(name, str) or not name.strip():
        return jsonify({
            "error": "Therapist name is required."
        }), 400

    name = name.strip()

    if Therapist.query.filter_by(name=name).first():
        return jsonify({
            "error": "A therapist with this name already exists."
        }), 409

    therapist = Therapist(name=name, is_active=True)

    try:
        db.session.add(therapist)
        db.session.commit()

        return jsonify({
            "message": "Therapist added successfully.",
            "therapist": {
                "id": therapist.id,
                "name": therapist.name,
                "is_active": therapist.is_active
            }
        }), 201

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Unable to add therapist."
        }), 500


@admin_bp.route("/therapists/<int:therapist_id>", methods=["PATCH"])
@admin_required
def update_therapist(therapist_id):
    """Allow administrators to rename or change therapist status."""

    therapist = db.session.get(Therapist, therapist_id)

    if not therapist:
        return jsonify({
            "error": "Therapist not found."
        }), 404

    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = data["name"]

        if not isinstance(name, str) or not name.strip():
            return jsonify({
                "error": "Therapist name cannot be empty."
            }), 400

        name = name.strip()

        existing = Therapist.query.filter(
            Therapist.name == name,
            Therapist.id != therapist_id
        ).first()

        if existing:
            return jsonify({
                "error": "Another therapist already has this name."
            }), 409

        therapist.name = name

    if "is_active" in data:
        if not isinstance(data["is_active"], bool):
            return jsonify({
                "error": "is_active must be true or false."
            }), 400

        therapist.is_active = data["is_active"]

    if "name" not in data and "is_active" not in data:
        return jsonify({
            "error": "Provide a name or is_active value to update."
        }), 400

    try:
        db.session.commit()

        return jsonify({
            "message": "Therapist updated successfully.",
            "therapist": {
                "id": therapist.id,
                "name": therapist.name,
                "is_active": therapist.is_active
            }
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Unable to update therapist."
        }), 500
