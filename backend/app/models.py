from datetime import datetime, timezone

from app.extensions import db


class Service(db.Model):
    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    price = db.Column(db.Integer, nullable=False)
    duration = db.Column(db.String(50), nullable=False)

    bookings = db.relationship(
        "Booking",
        back_populates="service"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "duration": self.duration
        }


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)

    customer_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)

    service_id = db.Column(
        db.Integer,
        db.ForeignKey("services.id"),
        nullable=False
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

    def to_dict(self):
        return {
            "id": self.id,
            "customer_name": self.customer_name,
            "phone": self.phone,
            "service": self.service.name,
            "price": self.service.price,
            "appointment_date": self.appointment_date,
            "appointment_time": self.appointment_time,
            "notes": self.notes,
            "status": self.status
        }