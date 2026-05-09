from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash
from jose import jwt
from datetime import datetime, timezone, timedelta

from ..extensions import db
from ..models import User


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def _get_json() -> dict:
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return {}
    return data


@auth_bp.post("/register")
def register():
    data = _get_json()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"error": "username, email, and password are required"}), 400

    if User.query.filter_by(email=email).first() is not None:
        return jsonify({"error": "email already registered"}), 409

    if User.query.filter_by(username=username).first() is not None:
        return jsonify({"error": "username already taken"}), 409

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "user created", "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = _get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "invalid credentials"}), 401

    login_user(user)
    token = create_token(user.id)
    return jsonify({"message": "login successful", "user": user.to_dict(), "token": token})


@auth_bp.post("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"message": "logout successful"})
