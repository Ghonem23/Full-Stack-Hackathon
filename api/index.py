import sys
import os

# Set root and backend paths explicitly
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, 'backend')

for path in [root_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from app import app
from models import db

# Redirect SQLite database to Vercel's writable /tmp directory
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/app.db'

# Ensure database tables exist in the runtime environment
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run()
