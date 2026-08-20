import sys
import os

# Point Python path to the backend directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the existing Flask app instance
from app import app

# Vercel serverless function entry
if __name__ == '__main__':
    app.run()