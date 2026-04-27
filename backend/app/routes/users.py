from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app import db
from app.models.user import User
from app.models.post import Post, Notification, Story
from datetime import datetime, timedelta
import os, uuid

users_bp = Blueprint('users', __name__)

def save_file(file):
    """Save uploaded file and return its URL. Works on Windows & Mac."""
    ext        = file.filename.rsplit('.', 1)[1].lower()
    filename   = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))
    media_type = 'video' if ext in {'mp4', 'mov'} else 'image'
    return f"/uploads/{filename}", media_type


@users_bp.route('/<int:user_id>', methods=['GET'])
@login_required
def get_profile(user_id):
    user = User.query.get_or_404(user_id)
    data = user.to_dict()

    if user.is_private and user.id != current_user.id:
        from app.models.post import FriendRequest
        is_friend = FriendRequest.query.filter(
            ((FriendRequest.sender_id == current_user.id) & (FriendRequest.receiver_id == user_id)) |
            ((FriendRequest.sender_id == user_id) & (FriendRequest.receiver_id == current_user.id)),
            FriendRequest.status == 'accepted'
        ).first()
        if not is_friend:
            data['posts']   = []
            data['private'] = True
            return jsonify({'user': data}), 200

    data['posts'] = [p.to_dict(current_user.id) for p in
                     Post.query.filter_by(user_id=user_id)
                               .order_by(Post.created_at.desc()).all()]
    return jsonify({'user': data}), 200


@users_bp.route('/me/update', methods=['PATCH'])
@login_required
def update_profile():
    data = request.get_json()
    if 'bio' in data:
        current_user.bio = data['bio'][:160]
    if 'is_private' in data:
        current_user.is_private = bool(data['is_private'])
    db.session.commit()
    return jsonify({'user': current_user.to_dict(include_email=True)}), 200


@users_bp.route('/me/avatar', methods=['POST'])
@login_required
def upload_avatar():
    file = request.files.get('avatar')
    if not file:
        return jsonify({'error': 'No file provided'}), 400
    url, _ = save_file(file)
    current_user.avatar_url = url
    db.session.commit()
    return jsonify({'avatar_url': current_user.avatar_url}), 200


@users_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    notifs = Notification.query.filter_by(user_id=current_user.id)\
                               .order_by(Notification.created_at.desc()).limit(30).all()
    return jsonify({'notifications': [n.to_dict() for n in notifs]}), 200


@users_bp.route('/notifications/read', methods=['POST'])
@login_required
def mark_read():
    Notification.query.filter_by(user_id=current_user.id, is_read=False)\
                      .update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'Marked as read'}), 200


@users_bp.route('/stories', methods=['POST'])
@login_required
def create_story():
    file = request.files.get('media')
    if not file:
        return jsonify({'error': 'No file'}), 400
    url, media_type = save_file(file)
    story = Story(
        user_id    = current_user.id,
        media_url  = url,
        media_type = media_type,
        expires_at = datetime.utcnow() + timedelta(hours=24)
    )
    db.session.add(story)
    db.session.commit()
    return jsonify({'story': story.to_dict()}), 201


@users_bp.route('/stories/feed', methods=['GET'])
@login_required
def stories_feed():
    from app.models.post import FriendRequest
    accepted = FriendRequest.query.filter(
        ((FriendRequest.sender_id == current_user.id) | (FriendRequest.receiver_id == current_user.id)),
        FriendRequest.status == 'accepted'
    ).all()
    friend_ids = set()
    for fr in accepted:
        friend_ids.add(fr.sender_id if fr.receiver_id == current_user.id else fr.receiver_id)
    friend_ids.add(current_user.id)

    stories = Story.query.filter(
        Story.user_id.in_(friend_ids),
        Story.expires_at > datetime.utcnow()
    ).order_by(Story.created_at.desc()).all()
    return jsonify({'stories': [s.to_dict() for s in stories]}), 200


@users_bp.route('/search', methods=['GET'])
@login_required
def search():
    q = request.args.get('q', '').strip()
    results = User.query.filter(
        User.username.ilike(f'%{q}%'),
        User.id != current_user.id
    ).limit(10).all()
    return jsonify({'users': [u.to_dict() for u in results]}), 200
