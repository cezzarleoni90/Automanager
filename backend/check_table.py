import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.models import db
from sqlalchemy import inspect

app = create_app()

def check_table():
    with app.app_context():
        inspector = inspect(db.engine)
        columns = inspector.get_columns('repuesto')
        print('Columnas en la tabla repuesto:')
        for col in columns:
            print(f'- {col["name"]}: {col["type"]}')

if __name__ == '__main__':
    check_table()