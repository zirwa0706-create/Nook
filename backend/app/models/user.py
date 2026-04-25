from app import db, login_manager
from flask_login import UserMixin
from datetime import datetime


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(30), unique=True, nullable=False)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(255), nullable=False)
    bio        = db.Column(db.String(160), default='')
    avatar_url = db.Column(db.String(300), default='')
    is_private = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    posts         = db.relationship('Post', backref='author', lazy=True, cascade='all, delete-orphan')
    stories       = db.relationship('Story', backref='author', lazy=True, cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='recipient', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_email=False):
        data = {
            'id':         self.id,
            'username':   self.username,
            'bio':        self.bio,
            'avatar_url': self.avatar_url,
            'is_private': self.is_private,
            'created_at': self.created_at.isoformat(),
        }
        if include_email:
            data['email'] = self.email
        return data
