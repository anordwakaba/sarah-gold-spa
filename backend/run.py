
import click

from app import create_app
from app.extensions import db
from app.models import Service, Admin


# Create the Flask application
app = create_app()


@app.cli.command("seed")
def seed():
    """Populate the database with Sarah Gold Spa services."""

    services = [
        {
            "name": "Swedish massage",
            "price": 3500,
            "duration": "60 minutes",
            "description": "A relaxing full-body massage."
        },
        {
            "name": "Deep tissue massage",
            "price": 4000,
            "duration": "60 minutes",
            "description": "A massage focusing on deeper muscle tension."
        },
        {
            "name": "Body to body massage",
            "price": 8000,
            "duration": "120 minutes",
            "description": "A premium full-body spa experience."
        },
        {
            "name": "Thai massage",
            "price": 5500,
            "duration": "90 minutes",
            "description": "A traditional Thai-inspired massage."
        },
        {
            "name": "Four hands massage",
            "price": 7000,
            "duration": "90 minutes",
            "description": "A coordinated massage performed by two therapists."
        },
        {
            "name": "Full body scrub",
            "price": 3500,
            "duration": "60 minutes",
            "description": "A full-body exfoliation treatment."
        },
        {
            "name": "Back massage",
            "price": 2500,
            "duration": "30 minutes",
            "description": "A focused massage for back tension."
        },
        {
            "name": "Reflexology",
            "price": 2500,
            "duration": "30 minutes",
            "description": "A relaxing foot pressure-point treatment."
        },
        {
            "name": "Sports massage",
            "price": 5500,
            "duration": "90 minutes",
            "description": "A massage designed for active individuals."
        },
        {
            "name": "Couples massage",
            "price": 10000,
            "duration": "90 minutes",
            "description": "A shared massage experience for two."
        },
        {
            "name": "Home/Hotel service",
            "price": 15000,
            "duration": "120 minutes",
            "description": "A spa service provided at a customer's location."
        }
    ]

    added_count = 0

    for service_data in services:
        existing_service = Service.query.filter_by(
            name=service_data["name"]
        ).first()

        if not existing_service:
            db.session.add(Service(**service_data))
            added_count += 1

    db.session.commit()

    print(f"Successfully added {added_count} spa services!")


@app.cli.command("create-admin")
def create_admin():
    """Create a secure administrator account."""

    username = click.prompt("Enter admin username").strip()

    if not username:
        raise click.ClickException("Username cannot be empty.")

    existing_admin = Admin.query.filter_by(
        username=username
    ).first()

    if existing_admin:
        raise click.ClickException("This admin username already exists.")

    password = click.prompt(
        "Enter admin password",
        hide_input=True,
        confirmation_prompt=True
    )

    if len(password) < 12:
        raise click.ClickException(
            "Password must contain at least 12 characters."
        )

    admin = Admin(username=username)
    admin.set_password(password)

    db.session.add(admin)
    db.session.commit()

    click.echo("Admin account created successfully!")


if __name__ == "__main__":
    app.run(debug=True)
