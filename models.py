from datetime import datetime
from app import db
from flask_login import UserMixin

class User(UserMixin, db.Model):
    """User model for authentication and chat history."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    # ensure password hash field has length of at least 256
    password_hash = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.relationship('Message', backref='user', lazy='dynamic')

class Message(db.Model):
    """Message model for storing chat history."""
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user', 'assistant' or 'developer'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # Add image data field (storing as Base64 string)
    image_data = db.Column(db.Text, nullable=True)
    # Is this message being streamed?
    is_streaming = db.Column(db.Boolean, default=False)
    # Reasoning effort level (low, medium, high)
    reasoning_effort = db.Column(db.String(10), nullable=True)
    # Reasoning summary for o3 and o4-mini models
    reasoning_summary = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        """Convert message to dictionary format for API responses."""
        message_dict = {
            'id': self.id,
            'content': self.content,
            'role': self.role,
            'timestamp': self.timestamp.isoformat(),
            'user_id': self.user_id,
            'is_streaming': self.is_streaming,
            'reasoning_effort': self.reasoning_effort,
            'reasoning_summary': self.reasoning_summary
        }
        
        # Include image data if present
        if self.image_data:
            message_dict['has_image'] = True
            # Note: We don't include the actual image data in the dict to keep response size small
        else:
            message_dict['has_image'] = False
            
        return message_dict