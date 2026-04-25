from app import db
from datetime import datetime


class Post(db.Model):
    __tablename__ = 'posts'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    body       = db.Column(db.Text, nullable=False)
    media_url  = db.Column(db.String(300), default='')
    media_type = db.Column(db.String(10), default='')   # 'image' | 'video' | ''
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    likes    = db.relationship('Like',    backref='post', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='post', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, current_user_id=None):
        return {
            'id':           self.id,
            'user_id':      self.user_id,
            'username':     self.author.username,
            'avatar_url':   self.author.avatar_url,
            'body':         self.body,
            'media_url':    self.media_url,
            'media_type':   self.media_type,
            'like_count':   len(self.likes),
            'comment_count':len(self.comments),
            'liked':        any(l.user_id == current_user_id for l in self.likes) if current_user_id else False,
            'created_at':   self.created_at.isoformat(),
        }


class Like(db.Model):
    __tablename__ = 'likes'

    id      = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)

    __table_args__ = (db.UniqueConstraint('user_id', 'post_id'),)


class Comment(db.Model):
    __tablename__ = 'comments'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id    = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    body       = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', backref='comments')

    def to_dict(self):
        return {
            'id':         self.id,
            'user_id':    self.user_id,
            'username':   self.author.username,
            'avatar_url': self.author.avatar_url,
            'body':       self.body,
            'created_at': self.created_at.isoformat(),
        }


class Story(db.Model):
    __tablename__ = 'stories'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    media_url  = db.Column(db.String(300), nullable=False)
    media_type = db.Column(db.String(10), default='image')
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'user_id':    self.user_id,
            'username':   self.author.username,
            'avatar_url': self.author.avatar_url,
            'media_url':  self.media_url,
            'media_type': self.media_type,
            'expires_at': self.expires_at.isoformat(),
        }


class FriendRequest(db.Model):
    __tablename__ = 'friend_requests'

    id          = db.Column(db.Integer, primary_key=True)
    sender_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status      = db.Column(db.String(10), default='pending')  # pending | accepted | declined
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    sender   = db.relationship('User', foreign_keys=[sender_id],   backref='sent_requests')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_requests')

    def to_dict(self):
        return {
            'id':              self.id,
            'sender_id':       self.sender_id,
            'sender_username': self.sender.username,
            'receiver_id':     self.receiver_id,
            'status':          self.status,
            'created_at':      self.created_at.isoformat(),
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type       = db.Column(db.String(20), nullable=False)  # like | comment | friend_request | friend_accepted
    message    = db.Column(db.String(200), nullable=False)
    is_read    = db.Column(db.Boolean, default=False)
    ref_id     = db.Column(db.Integer, default=None)       # related post/user id
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'type':       self.type,
            'message':    self.message,
            'is_read':    self.is_read,
            'ref_id':     self.ref_id,
            'created_at': self.created_at.isoformat(),
        }
