
from flask import Flask
from flask_cors import CORS

from config import Config
from app.extensions import db, migrate


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    # Allow the React frontend to communicate with Flask
    frontend_url = Config.FRONTEND_URL

    CORS(
        app,
        origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            frontend_url
        ],
        supports_credentials=True
    )

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
