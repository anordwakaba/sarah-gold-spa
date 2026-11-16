
from flask import Blueprint, jsonify, request, session

from app.models import Admin


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


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

    # Clear any previous session before creating a new one.
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
def current_admin():
    """Check whether an administrator is logged in."""

    admin_id = session.get("admin_id")

    if not admin_id:
        return jsonify({
            "error": "Authentication required."
        }), 401

    admin = Admin.query.get(admin_id)

    if not admin:
        session.clear()

        return jsonify({
            "error": "Admin account not found."
        }), 401

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
