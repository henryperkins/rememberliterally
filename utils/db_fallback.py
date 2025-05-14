"""
Fallback storage module for when the database is not available.
This allows the application to function without database access.
"""
import logging

# In-memory user storage
users = {}
messages = []

def register_user(username):
    """Register a new user or get an existing user."""
    if username in users:
        return users[username]
    
    # Create a simple user dict with an incrementing ID
    user_id = len(users) + 1
    users[username] = {
        'id': user_id,
        'username': username
    }
    logging.info(f"Created in-memory user: {username} (ID: {user_id})")
    return users[username]

def add_message(user_id, content, role):
    """Add a message to the in-memory storage."""
    message_id = len(messages) + 1
    message = {
        'id': message_id,
        'user_id': user_id,
        'content': content,
        'role': role,
        'timestamp': None  # No timestamp in memory
    }
    messages.append(message)
    return message

def get_messages_for_user(user_id):
    """Get all messages for a specific user."""
    return [msg for msg in messages if msg['user_id'] == user_id]

def clear_messages_for_user(user_id):
    """Clear all messages for a specific user."""
    global messages
    messages = [msg for msg in messages if msg['user_id'] != user_id]
    logging.info(f"Cleared in-memory messages for user ID: {user_id}")
    return True