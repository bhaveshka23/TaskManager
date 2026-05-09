from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from ..extensions import db, socketio
from ..models import Task


tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

ALLOWED_PRIORITIES = {"low", "medium", "high"}
ALLOWED_STATUSES = {"pending", "in_progress", "completed"}


def _get_json() -> dict:
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return {}
    return data


def _normalize_value(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def _validate_task_fields(data: dict) -> tuple[dict, list[str]]:
    errors = []
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    priority = _normalize_value(data.get("priority", "")) if data.get("priority") else ""
    status = _normalize_value(data.get("status", "")) if data.get("status") else ""

    if not title:
        errors.append("title is required")
    if not priority or priority not in ALLOWED_PRIORITIES:
        errors.append("priority must be low, medium, or high")
    if not status or status not in ALLOWED_STATUSES:
        errors.append("status must be pending, in_progress, or completed")

    return (
        {
            "title": title,
            "description": description,
            "priority": priority,
            "status": status,
        },
        errors,
    )


def _emit_task_event(action: str, task: Task | None, task_id: int | None = None):
    payload = {
        "action": action,
        "task": task.to_dict() if task else None,
        "task_id": task_id,
        "user_id": current_user.id,
    }
    socketio.emit("task_updated", payload)


@tasks_bp.post("")
@login_required
def create_task():
    data = _get_json()
    validated, errors = _validate_task_fields(data)
    if errors:
        return jsonify({"errors": errors}), 400

    task = Task(user_id=current_user.id, **validated)
    db.session.add(task)
    db.session.commit()

    _emit_task_event("created", task)
    return jsonify({"message": "task created", "task": task.to_dict()}), 201


@tasks_bp.get("")
@login_required
def list_tasks():
    tasks = (
        Task.query.filter_by(user_id=current_user.id)
        .order_by(Task.created_at.desc())
        .all()
    )
    return jsonify({"tasks": [task.to_dict() for task in tasks]})


@tasks_bp.put("/<int:task_id>")
@login_required
def update_task(task_id: int):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if task is None:
        return jsonify({"error": "task not found"}), 404

    data = _get_json()
    validated, errors = _validate_task_fields({
        "title": data.get("title", task.title),
        "description": data.get("description", task.description),
        "priority": data.get("priority", task.priority),
        "status": data.get("status", task.status),
    })

    if errors:
        return jsonify({"errors": errors}), 400

    task.title = validated["title"]
    task.description = validated["description"]
    task.priority = validated["priority"]
    task.status = validated["status"]

    db.session.commit()
    _emit_task_event("updated", task)

    return jsonify({"message": "task updated", "task": task.to_dict()})


@tasks_bp.delete("/<int:task_id>")
@login_required
def delete_task(task_id: int):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if task is None:
        return jsonify({"error": "task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    _emit_task_event("deleted", None, task_id=task_id)

    return jsonify({"message": "task deleted"})
