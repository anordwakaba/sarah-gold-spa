
"""Add email to admin accounts

Revision ID: dc87e4bad2b4
Revises: 1f9e90d60cf4
"""
from alembic import op
import sqlalchemy as sa

revision = 'dc87e4bad2b4'
down_revision = '1f9e90d60cf4'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('admins') as batch_op:
        batch_op.add_column(
            sa.Column('email', sa.String(length=255), nullable=True)
        )
        batch_op.create_unique_constraint(
            'uq_admins_email', ['email']
        )


def downgrade():
    with op.batch_alter_table('admins') as batch_op:
        batch_op.drop_constraint(
            'uq_admins_email', type_='unique'
        )
        batch_op.drop_column('email')
