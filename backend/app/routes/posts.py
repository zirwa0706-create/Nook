from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app import db, socketio
from app.models.post import Post, Like, Comment, Notification
from app.models.user import User
import os, uuid

posts_bp = Blueprint('posts', __name__)

ALLOWED = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov'}

def allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED

def save_file(file):
    """Save uploaded file and return its URL. Works on Windows & Mac."""
    ext        = file.filename.rsplit('.', 1)[1].lower()
    filename   = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))
    return f"/uploads/{filename}", ('video' if ext in {'mp4', 'mov'} else 'image')


@posts_bp.route('/feed', methods=['GET'])
@login_required
def feed():
    from app.models.post import FriendRequest
    accepted = FriendRequest.query.filter(
        ((FriendRequest.sender_id == current_user.id) | (FriendRequest.receiver_id == current_user.id)),
        FriendRequest.status == 'accepted'
    ).all()

    friend_ids = set()
    for fr in accepted:
        friend_ids.add(fr.sender_id if fr.receiver_id == current_user.id else fr.receiver_id)
    friend_ids.add(current_user.id)

    posts = Post.query.filter(Post.user_id.in_(friend_ids))\
                      .order_by(Post.created_at.desc()).limit(30).all()
    return jsonify({'posts': [p.to_dict(current_user.id) for p in posts]}), 200


@posts_bp.route('/', methods=['POST'])
@login_required
def create_post():
    body  = request.form.get('body', '').strip()
    media = request.files.get('media')

    if not body and not media:
        return jsonify({'error': 'Post cannot be empty'}), 400

    media_url, media_type = '', ''
    if media and media.filename and allowed(media.filename):
        media_url, media_type = save_file(media)

    post = Post(
        user_id    = current_user.id,
        body       = body,
        media_url  = media_url,
        media_type = media_type
    )
    db.session.add(post)
    db.session.commit()

    socketio.emit('new_post', post.to_dict(current_user.id), room=f"user_{current_user.id}")
    return jsonify({'post': post.to_dict(current_user.id)}), 201


@posts_bp.route('/<int:post_id>/like', methods=['POST'])
@login_required
def toggle_like(post_id):
    post     = Post.query.get_or_404(post_id)
    existing = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'liked': False, 'like_count': len(post.likes)}), 200

    like = Like(user_id=current_user.id, post_id=post_id)
    db.session.add(like)

    if post.user_id != current_user.id:
        notif = Notification(
            user_id = post.user_id,
            type    = 'like',
            message = f"{current_user.username} liked your post",
            ref_id  = post_id
        )
        db.session.add(notif)
        db.session.commit()
        socketio.emit('notification', notif.to_dict(), room=f"user_{post.user_id}")
    else:
        db.session.commit()

    return jsonify({'liked': True, 'like_count': len(post.likes)}), 200


@posts_bp.route('/<int:post_id>/comments', methods=['GET', 'POST'])
@login_required
def comments(post_id):
    post = Post.query.get_or_404(post_id)

    if request.method == 'GET':
        return jsonify({'comments': [c.to_dict() for c in post.comments]}), 200

    data = request.get_json()
    body = data.get('body', '').strip() if data else ''
    if not body:
        return jsonify({'error': 'Comment cannot be empty'}), 400

    comment = Comment(user_id=current_user.id, post_id=post_id, body=body)
    db.session.add(comment)

    if post.user_id != current_user.id:
        notif = Notification(
            user_id = post.user_id,
            type    = 'comment',
            message = f"{current_user.username} commented on your post",
            ref_id  = post_id
        )
        db.session.add(notif)
        db.session.commit()
        socketio.emit('notification', notif.to_dict(), room=f"user_{post.user_id}")
    else:
        db.session.commit()

    socketio.emit('new_comment', comment.to_dict(), room=f"post_{post_id}")
    return jsonify({'comment': comment.to_dict()}), 201


@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(post)
    db.session.commit()
    return jsonify({'message': 'Post deleted'}), 200
