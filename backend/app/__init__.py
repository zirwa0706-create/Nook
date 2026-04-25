from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db            = SQLAlchemy()
login_manager = LoginManager()
bcrypt        = Bcrypt()
socketio      = SocketIO()


def create_app():
    flask_app = Flask(__name__)

    flask_app.config['SECRET_KEY']                     = os.getenv('SECRET_KEY', 'dev-secret')
    flask_app.config['SQLALCHEMY_DATABASE_URI']        = os.getenv('DATABASE_URL', 'sqlite:///nook.db')
    flask_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    flask_app.config['UPLOAD_FOLDER']                  = os.getenv('UPLOAD_FOLDER', 'uploads')
    flask_app.config['MAX_CONTENT_LENGTH']             = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))

    CORS(flask_app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

    db.init_app(flask_app)
    login_manager.init_app(flask_app)
    bcrypt.init_app(flask_app)
    socketio.init_app(flask_app, cors_allowed_origins="http://localhost:5173")

    from app.models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from app.routes.auth    import auth_bp
    from app.routes.users   import users_bp
    from app.routes.posts   import posts_bp
    from app.routes.friends import friends_bp

    flask_app.register_blueprint(auth_bp,    url_prefix='/api/auth')
    flask_app.register_blueprint(users_bp,   url_prefix='/api/users')
    flask_app.register_blueprint(posts_bp,   url_prefix='/api/posts')
    flask_app.register_blueprint(friends_bp, url_prefix='/api/friends')

    from app.socket import events  # registers socket handlers

    with flask_app.app_context():
        db.create_all()

    return flask_app
