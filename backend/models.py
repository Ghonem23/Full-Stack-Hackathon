from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

db = SQLAlchemy()

def get_utc_now():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now)

    # Relationships
    queries = db.relationship("QueryLog", backref="user", lazy=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "fullName": self.full_name,
            "email": self.email,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class QueryLog(db.Model):
    __tablename__ = "query_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    query = db.Column(db.Text, nullable=False)
    latency_ms = db.Column(db.Integer, default=0)
    avg_score = db.Column(db.Float, default=90.0)
    created_at = db.Column(db.DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "query": self.query,
            "latencyMs": self.latency_ms,
            "score": self.avg_score,
            "timestamp": self.created_at.isoformat() if self.created_at else None,
        }