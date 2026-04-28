from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app import db, socketio
from app.models.post import FriendRequest, Notification
from app.models.user import User

friends_bp = Blueprint('friends', __name__)


@friends_bp.route('/status/<int:user_id>', methods=['GET'])
@login_required
def get_status(user_id):
    """Return friendship status between current user and another user."""
    fr = FriendRequest.query.filter(
        ((FriendRequest.sender_id == current_user.id) & (FriendRequest.receiver_id == user_id)) |
        ((FriendRequest.sender_id == user_id) & (FriendRequest.receiver_id == current_user.id))
    ).first()

    if not fr:
        return jsonify({'status': 'none'}), 200
    return jsonify({'status': fr.status, 'request_id': fr.id, 'i_sent': fr.sender_id == current_user.id}), 200


@friends_bp.route('/request/<int:user_id>', methods=['POST'])
@login_required
def send_request(user_id):
    if user_id == current_user.id:
        return jsonify({'error': 'Cannot add yourself'}), 400

    existing = FriendRequest.query.filter(
        ((FriendRequest.sender_id == current_user.id) & (FriendRequest.receiver_id == user_id)) |
        ((FriendRequest.sender_id == user_id) & (FriendRequest.receiver_id == current_user.id))
    ).first()

    if existing:
        return jsonify({'error': 'Request already exists', 'status': existing.status}), 409

    fr = FriendRequest(sender_id=current_user.id, receiver_id=user_id)
    db.session.add(fr)

    notif = Notification(
        user_id=user_id,
        type='friend_request',
        message=f"{current_user.username} sent you a friend request",
        ref_id=current_user.id
    )
    db.session.add(notif)
    db.session.commit()

    socketio.emit('notification', notif.to_dict(), room=f"user_{user_id}")
    return jsonify({'request': fr.to_dict()}), 201


@friends_bp.route('/respond/<int:request_id>/<string:action>', methods=['POST'])
@login_required
def respond(request_id, action):
    fr = FriendRequest.query.get_or_404(request_id)
    if fr.receiver_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    if action not in ('accept', 'decline'):
        return jsonify({'error': 'Invalid action'}), 400

    fr.status = 'accepted' if action == 'accept' else 'declined'

    if action == 'accept':
        notif = Notification(
            user_id=fr.sender_id,
            type='friend_accepted',
            message=f"{current_user.username} accepted your friend request",
            ref_id=current_user.id
        )
        db.session.add(notif)
        db.session.commit()
        socketio.emit('notification', notif.to_dict(), room=f"user_{fr.sender_id}")
    else:
        db.session.commit()

    return jsonify({'status': fr.status}), 200


@friends_bp.route('/list', methods=['GET'])
@login_required
def list_friends():
    accepted = FriendRequest.query.filter(
        ((FriendRequest.sender_id == current_user.id) | (FriendRequest.receiver_id == current_user.id)),
        FriendRequest.status == 'accepted'
    ).all()

    friends = []
    for fr in accepted:
        uid = fr.receiver_id if fr.sender_id == current_user.id else fr.sender_id
        u   = User.query.get(uid)
        if u:
            friends.append(u.to_dict())
    return jsonify({'friends': friends}), 200


@friends_bp.route('/requests/pending', methods=['GET'])
@login_required
def pending():
    reqs = FriendRequest.query.filter_by(receiver_id=current_user.id, status='pending').all()
    return jsonify({'requests': [r.to_dict() for r in reqs]}), 200
