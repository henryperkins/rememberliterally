import os
import logging
from flask import Flask, render_template, request, jsonify, session
import json
from sqlalchemy.orm import DeclarativeBase
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user, login_user, logout_user, login_required
from utils.openai_helper import generate_ai_response

# Flag to indicate if the database is available
database_status = {'available': True}

def is_database_available():
    """Check if the database is available."""
    return database_status['available']

def set_database_unavailable():
    """Mark the database as unavailable."""
    database_status['available'] = False
    logging.warning("Running without database support - using in-memory storage instead")

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
database_url = os.environ.get("DATABASE_URL")
# Ensure proper URL format for SQLAlchemy
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
    "connect_args": {
        "connect_timeout": 10,
        "application_name": "ai-chat-app"
    }
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
    try:
        db.create_all()
        logging.info("Database tables created successfully")
    except Exception as e:
        logging.error(f"Error creating database tables: {str(e)}")
        # Mark database as unavailable
        set_database_unavailable()

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
        data = request.json
        username = data.get('username', '').strip()
        
        if not username:
            return jsonify({
                'status': 'error',
                'message': 'Username is required'
            }), 400
        
        if is_database_available():
            # Database storage path
            from models import User
            
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
        else:
            # Fallback storage path
            from utils.db_fallback import register_user as fallback_register_user
            
            # Register user in memory
            user = fallback_register_user(username)
            
            return jsonify({
                'status': 'success',
                'user_id': user['id'],
                'username': user['username']
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
        from utils.openai_helper import generate_ai_response, stream_ai_response
        from flask import Response
        
        data = request.json
        message_content = data.get('message', '')
        conversation_history = data.get('conversation_history', [])
        image_data = data.get('image_data')  # Base64 encoded image data
        use_streaming = data.get('streaming', False)  # Whether to use streaming response
        
        # Check if user is logged in via session
        user_id = data.get('user_id')
        username = data.get('username', 'User')
        
        # Log the incoming request
        logging.debug(f"Received message from {username}: {message_content}")
        logging.debug(f"Conversation history length: {len(conversation_history)}")
        if image_data:
            logging.debug("Image data included with message")
        
        # Store user message in database if user_id is provided
        if user_id:
            user_message = Message(
                content=message_content,
                role='user',
                user_id=user_id,
                image_data=image_data
            )
            db.session.add(user_message)
            db.session.commit()
        
        # Handle streaming or regular response
        if use_streaming:
            def generate():
                # Create an initial streaming message in the database
                ai_message = None
                if user_id:
                    ai_message = Message(
                        content="",
                        role='assistant',
                        user_id=user_id,
                        is_streaming=True
                    )
                    db.session.add(ai_message)
                    db.session.commit()
                    message_id = ai_message.id
                
                # Start streaming the response
                full_response = ""
                for chunk in stream_ai_response(message_content, conversation_history, image_data):
                    full_response += chunk
                    # Update the streaming message in the database
                    if user_id and ai_message:
                        ai_message.content = full_response
                        db.session.commit()
                    # Send the chunk to the client
                    yield f"data: {json.dumps({'chunk': chunk, 'is_final': False})}\n\n"
                
                # Update the final message in the database and mark as no longer streaming
                if user_id and ai_message:
                    ai_message.is_streaming = False
                    db.session.commit()
                
                # Send the final chunk to the client
                yield f"data: {json.dumps({'chunk': '', 'is_final': True, 'full_response': full_response})}\n\n"
            
            return Response(generate(), mimetype='text/event-stream')
        else:
            # Generate regular AI response
            ai_response = generate_ai_response(message_content, conversation_history, image_data)
            
            # Store AI response in database if user_id is provided
            if user_id:
                ai_message = Message(
                    content=ai_response,
                    role='assistant',
                    user_id=user_id
                )
                db.session.add(ai_message)
                db.session.commit()
            
            # Return the response
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
        
@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """Handle image uploads for chat"""
    try:
        if 'image' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No image file provided'
            }), 400
            
        image_file = request.files['image']
        
        if image_file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'No image selected'
            }), 400
            
        # Read and encode the image as base64
        image_data = image_file.read()
        import base64
        encoded_image = base64.b64encode(image_data).decode('utf-8')
        
        return jsonify({
            'status': 'success',
            'image_data': encoded_image
        })
        
    except Exception as e:
        logging.error(f"Error in image upload: {str(e)}")
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
        
@app.route('/api/messages/<int:message_id>/image', methods=['GET'])
def get_message_image(message_id):
    """Get image data for a specific message."""
    try:
        from models import Message
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                'status': 'error',
                'message': 'User ID is required'
            }), 400
        
        # Get the message and verify it belongs to the user
        message = Message.query.filter_by(id=message_id, user_id=user_id).first()
        
        if not message:
            return jsonify({
                'status': 'error',
                'message': 'Message not found or does not belong to this user'
            }), 404
        
        # Check if message has image data
        if not message.image_data:
            return jsonify({
                'status': 'error',
                'message': 'This message does not have an image'
            }), 404
        
        # Return the image data
        return jsonify({
            'status': 'success',
            'image_data': message.image_data
        })
    except Exception as e:
        logging.error(f"Error in get_message_image endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"An error occurred: {str(e)}"
        }), 500
        
@app.route('/api/messages/clear', methods=['POST'])
def clear_messages():
    """Clear all messages for a user."""
    try:
        from models import Message
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'status': 'error',
                'message': 'User ID is required'
            }), 400
        
        # Delete all messages for the user
        Message.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        logging.debug(f"Cleared messages for user ID: {user_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'All messages cleared successfully'
        })
    except Exception as e:
        logging.error(f"Error in clear_messages endpoint: {str(e)}")
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
