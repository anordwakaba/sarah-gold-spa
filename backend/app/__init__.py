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

    # Import route blueprints
    from app.routes.main import main_bp
    from app.routes.bookings import bookings_bp
    from app.routes.admin import admin_bp

    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(admin_bp)

    return app

