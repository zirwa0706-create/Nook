from flask_socketio import join_room, leave_room
from flask_login import current_user
from app import socketio


@socketio.on('connect')
def on_connect():
    if current_user.is_authenticated:
        join_room(f"user_{current_user.id}")
        print(f"[Socket] {current_user.username} connected → room user_{current_user.id}")


@socketio.on('disconnect')
def on_disconnect():
    if current_user.is_authenticated:
        leave_room(f"user_{current_user.id}")


@socketio.on('join_post')
def on_join_post(data):
    post_id = data.get('post_id')
    if post_id:
        join_room(f"post_{post_id}")


@socketio.on('leave_post')
def on_leave_post(data):
    post_id = data.get('post_id')
    if post_id:
        leave_room(f"post_{post_id}")
