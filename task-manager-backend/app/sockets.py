from .extensions import socketio


@socketio.on("connect")
def handle_connect():
    socketio.emit("notification", {"message": "Connected to real-time updates"})


@socketio.on("ping_test")
def handle_ping(data):
    socketio.emit("notification", {"message": f"Pong: {data.get('message', 'ok')}"})
