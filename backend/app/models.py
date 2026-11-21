
from datetime import datetime, timezone
import re

from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash


# Connect bookings to multiple services
booking_services = db.Table(
    "booking_services",
    db.Column(
        "booking_id",
        db.Integer,
        db.ForeignKey("bookings.id"),
        primary_key=True
    ),
    db.Column(
        "service_id",
        db.Integer,
        db.ForeignKey("services.id"),
        primary_key=True
    )
)


class Service(db.Model):
    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    price = db.Column(db.Integer, nullable=False)
    duration = db.Column(db.String(50), nullable=False)

    # Original relationship, retained for existing bookings
    bookings = db.relationship(
        "Booking",
        back_populates="service"
    )

    # New relationship for multiple services per booking
    multi_bookings = db.relationship(
        "Booking",
        secondary=booking_services,
        back_populates="services"
    )

    @property
    def duration_minutes(self):
        match = re.search(r"\d+", self.duration or "")
        return int(match.group()) if match else 0

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "duration": self.duration
        }


class Therapist(db.Model):
    __tablename__ = "therapists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    bookings = db.relationship(
        "Booking",
        back_populates="therapist"
    )


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)

    customer_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)

    # Retained to preserve existing bookings
    # and identify the first service
    service_id = db.Column(
        db.Integer,
        db.ForeignKey("services.id"),
        nullable=False
    )

    therapist_id = db.Column(
        db.Integer,
        db.ForeignKey("therapists.id"),
        nullable=True
    )

    appointment_date = db.Column(db.String(20), nullable=False)
    appointment_time = db.Column(db.String(20), nullable=False)

    notes = db.Column(db.Text)

    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    service = db.relationship(
        "Service",
        back_populates="bookings"
    )

    therapist = db.relationship(
        "Therapist",
        back_populates="bookings"
    )

    # All services selected for this booking
    services = db.relationship(
        "Service",
        secondary=booking_services,
        back_populates="multi_bookings"
    )

    @property
    def selected_services(self):
        # Support older bookings that have no association records
        return self.services if self.services else [self.service]

    @property
    def total_price(self):
        return sum(service.price for service in self.selected_services)

    @property
    def total_duration_minutes(self):
        return sum(
            service.duration_minutes
            for service in self.selected_services
        )

    def to_dict(self):
        return {
            "id": self.id,
            "customer_name": self.customer_name,
            "phone": self.phone,
            "service": self.service.name,
            "services": [
                service.to_dict()
                for service in self.selected_services
            ],
            "total_price": self.total_price,
            "total_duration_minutes": self.total_duration_minutes,
            "price": self.total_price,
            "therapist": self.therapist.name if self.therapist else None,
            "appointment_date": self.appointment_date,
            "appointment_time": self.appointment_time,
            "notes": self.notes,
            "status": self.status
        }



class Admin(db.Model):
    """
    Stores administrator accounts for Sarah Gold Spa.
    """

    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    password_reset_nonce = db.Column(db.String(64), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
