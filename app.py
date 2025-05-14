import os
import logging
from flask import Flask, render_template, request, jsonify, session
import json
from utils.openai_helper import generate_ai_response

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key-for-development")

@app.route('/')
def index():
    """Render the main chat interface."""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """Process chat messages and get AI responses."""
    try:
        data = request.json
        message = data.get('message', '')
        username = data.get('username', 'User')
        conversation_history = data.get('conversation_history', [])
        
        # Log the incoming request
        logging.debug(f"Received message from {username}: {message}")
        logging.debug(f"Conversation history length: {len(conversation_history)}")
        
        # Generate AI response
        ai_response = generate_ai_response(message, conversation_history)
        
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
