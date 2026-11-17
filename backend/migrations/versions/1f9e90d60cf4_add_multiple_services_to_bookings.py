
"""Add multiple services to bookings

Revision ID: 1f9e90d60cf4
Revises: 9d0dc885a659
"""

from alembic import op
import sqlalchemy as sa


revision = '1f9e90d60cf4'
down_revision = '9d0dc885a659'
branch_labels = None
depends_on = None


def upgrade():
    # Create the table connecting bookings to multiple services
    op.create_table(
        'booking_services',
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ['booking_id'],
            ['bookings.id']
        ),
        sa.ForeignKeyConstraint(
            ['service_id'],
            ['services.id']
        ),
        sa.PrimaryKeyConstraint('booking_id', 'service_id')
    )

    # Preserve existing bookings by copying their original service
    connection = op.get_bind()

    existing_bookings = connection.execute(
        sa.text("""
            SELECT id, service_id
            FROM bookings
            WHERE service_id IS NOT NULL
        """)
    ).fetchall()

    for booking in existing_bookings:
        connection.execute(
            sa.text("""
                INSERT INTO booking_services (booking_id, service_id)
                VALUES (:booking_id, :service_id)
            """),
            {
                "booking_id": booking.id,
                "service_id": booking.service_id
            }
        )


def downgrade():
    op.drop_table('booking_services')
