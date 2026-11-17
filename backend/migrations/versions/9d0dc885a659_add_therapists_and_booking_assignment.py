
"""Add therapists and booking assignment

Revision ID: 9d0dc885a659
Revises: 4cf64bc99413
Create Date: 2026-11-16 18:16:20.519770
"""

from alembic import op
import sqlalchemy as sa


revision = '9d0dc885a659'
down_revision = '4cf64bc99413'
branch_labels = None
depends_on = None


def upgrade():
    # The therapists table already exists from the previous
    # partially completed migration attempt.

    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('therapist_id', sa.Integer(), nullable=True)
        )

        batch_op.create_foreign_key(
            'fk_bookings_therapist_id',
            'therapists',
            ['therapist_id'],
            ['id']
        )


def downgrade():
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.drop_constraint(
            'fk_bookings_therapist_id',
            type_='foreignkey'
        )

        batch_op.drop_column('therapist_id')

    op.drop_table('therapists')
