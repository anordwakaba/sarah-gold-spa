from flask import Flask

from config import Config
from app.extensions import db, migrate


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    # Initialise database
    db.init_app(app)

    # Initialise migrations
    migrate.init_app(app, db)

    # Import models
    from app import models

    # Register routes
    from app.routes.main import main_bp
    from app.routes.bookings import bookings_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(bookings_bp)

    return app