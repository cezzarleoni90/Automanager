"""add tipo_servicio column

Revision ID: a06d8a8ba2c4
Revises: bfaa769d66e3
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a06d8a8ba2c4'
down_revision = 'bfaa769d66e3'
branch_labels = None
depends_on = None


def upgrade():
    # Actualizamos los registros existentes con el valor por defecto
    op.execute("UPDATE servicio SET tipo_servicio = 'Mantenimiento' WHERE tipo_servicio IS NULL")
    
    # Ahora hacemos la columna NOT NULL
    with op.batch_alter_table('servicio') as batch_op:
        batch_op.alter_column('tipo_servicio',
                            existing_type=sa.String(50),
                            nullable=False)


def downgrade():
    with op.batch_alter_table('servicio') as batch_op:
        batch_op.alter_column('tipo_servicio',
                            existing_type=sa.String(50),
                            nullable=True)
