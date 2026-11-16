 
from flask import Blueprint, jsonify, render_template

from app.models import Service


# Create the main blueprint
main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def home():
    """Display the Sarah Gold Spa homepage."""
    return render_template("index.html")


@main_bp.route("/api/services", methods=["GET"])
def get_services():
    """Retrieve all available spa services."""

    services = Service.query.all()

    return jsonify([
        service.to_dict()
        for service in services
    ]), 200


@main_bp.route("/health", methods=["GET"])
def health():
    """Check whether the Gold Spa API is running."""

    return jsonify({
        "message": "Sarah Gold Spa API is running",
        "status": "success"
    }), 200
