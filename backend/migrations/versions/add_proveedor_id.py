"""add proveedor_id column

Revision ID: add_proveedor_id
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_proveedor_id'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Agregar columna proveedor_id a la tabla repuesto
    op.add_column('repuesto', sa.Column('proveedor_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_repuesto_proveedor',
        'repuesto', 'proveedor',
        ['proveedor_id'], ['id']
    )

def downgrade():
    # Eliminar la columna proveedor_id
    op.drop_constraint('fk_repuesto_proveedor', 'repuesto', type_='foreignkey')
    op.drop_column('repuesto', 'proveedor_id') 