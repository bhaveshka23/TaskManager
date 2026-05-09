import numpy as np
import pandas as pd
from flask import Blueprint, jsonify
from flask_login import current_user, login_required

from ..models import Task


analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@analytics_bp.get("")
@login_required
def task_analytics():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    df = pd.DataFrame([{"status": task.status} for task in tasks])

    total = int(len(df))
    if total == 0:
        completed = 0
    else:
        completed = int((df["status"] == "completed").sum())

    pending = int((df["status"] == "pending").sum()) if total else 0
    completion_percentage = (
        float(np.round((completed / total) * 100, 2)) if total else 0.0
    )

    return jsonify(
        {
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "completion_percentage": completion_percentage,
        }
    )
