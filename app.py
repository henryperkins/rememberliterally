import os
import logging
from flask import Flask, render_template, request, jsonify, session
import json
from sqlalchemy.orm import DeclarativeBase
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user, login_user, logout_user, login_required
from utils.openai_helper import generate_ai_response

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Setup database
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key-for-development")

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize database
db.init_app(app)

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index'

# Create all tables
with app.app_context():
    import models  # Import models here to avoid circular imports
    db.create_all()

@login_manager.user_loader
def load_user(id):
    from models import User
    return User.query.get(int(id))

@app.route('/')
def index():
    """Render the main chat interface."""
    return render_template('index.html')

@app.route('/api/users', methods=['POST'])
def register_user():
    """Register a new user or login an existing user by username."""
    try:
        from models import User
        data = request.json
        username = data.get('username', '').strip()
        
        if not username:
            return jsonify({
                'status': 'error',
                'message': 'Username is required'
            }), 400
        
        # Check if user exists
        user = User.query.filter_by(username=username).first()
        
        # If user doesn't exist, create a new one
        if not user:
            user = User(username=username)
            db.session.add(user)
            db.session.commit()
            logging.debug(f"Created new user: {username}")
        
        # Login the user
        login_user(user)
        
        return jsonify({
            'status': 'success',
            'user_id': user.id,
            'username': user.username
        })
    except Exception as e:
        logging.error(f"Error in register_user endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"An error occurred: {str(e)}"
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Process chat messages and get AI responses."""
    try:
        from models import Message
        data = request.json
        message_content = data.get('message', '')
        conversation_history = data.get('conversation_history', [])
        
        # Check if user is logged in via session
        user_id = data.get('user_id')
        username = data.get('username', 'User')
        
        # Log the incoming request
        logging.debug(f"Received message from {username}: {message_content}")
        logging.debug(f"Conversation history length: {len(conversation_history)}")
        
        # Store user message in database if user_id is provided
        if user_id:
            user_message = Message(
                content=message_content,
                role='user',
                user_id=user_id
            )
            db.session.add(user_message)
            db.session.commit()
        
        # Generate AI response
        ai_response = generate_ai_response(message_content, conversation_history)
        
        # Store AI response in database if user_id is provided
        if user_id:
            ai_message = Message(
                content=ai_response,
                role='assistant',
                user_id=user_id
            )
            db.session.add(ai_message)
            db.session.commit()
        
        return jsonify({
            'status': 'success',
            'response': ai_response
        })
    except Exception as e:
        logging.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"An error occurred: {str(e)}"
        }), 500
        
@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Get conversation history for a user."""
    try:
        from models import Message
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                'status': 'error',
                'message': 'User ID is required'
            }), 400
        
        # Get messages for the user
        messages = Message.query.filter_by(user_id=user_id).order_by(Message.timestamp).all()
        
        # Convert messages to dictionaries
        message_list = [msg.to_dict() for msg in messages]
        
        return jsonify({
            'status': 'success',
            'messages': message_list
        })
    except Exception as e:
        logging.error(f"Error in get_messages endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"An error occurred: {str(e)}"
        }), 500

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({
        'status': 'error',
        'message': 'An internal server error occurred'
    }), 500
