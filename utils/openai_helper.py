import os
import logging
import json
from openai import AzureOpenAI

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Get environment variables for Azure OpenAI
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.environ.get("AZURE_OPENAI_API_VERSION", "2025-03-01-preview")
AZURE_OPENAI_DEPLOYMENT_NAME = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")

def get_openai_client():
    """Create and return an Azure OpenAI client."""
    try:
        client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_endpoint=AZURE_OPENAI_ENDPOINT
        )
        return client
    except Exception as e:
        logging.error(f"Error creating OpenAI client: {str(e)}")
        raise

def format_conversation_history(conversation_history):
    """Format the conversation history for the OpenAI API."""
    formatted_messages = []
    
    for message in conversation_history:
        if message['role'] == 'user':
            formatted_messages.append({
                "role": "user", 
                "content": message['content']
            })
        elif message['role'] == 'assistant':
            formatted_messages.append({
                "role": "assistant", 
                "content": message['content']
            })
    
    return formatted_messages

def generate_ai_response(message, conversation_history=None):
    """Generate an AI response using Azure OpenAI API."""
    if conversation_history is None:
        conversation_history = []
    
    try:
        client = get_openai_client()
        
        # Format conversation history for the API
        formatted_history = format_conversation_history(conversation_history)
        
        # Prepare the input
        input_messages = formatted_history + [{"role": "user", "content": message}]
        
        # Get response from Azure OpenAI
        logging.debug(f"Sending request to Azure OpenAI with {len(input_messages)} messages")
        
        response = client.responses.create(
            model=AZURE_OPENAI_DEPLOYMENT_NAME,
            input=input_messages
        )
        
        # Extract and return the response text
        if response.output and len(response.output) > 0:
            for output in response.output:
                if output.role == "assistant" and output.content:
                    # Extract text content
                    for content_item in output.content:
                        if content_item.type == "output_text":
                            return content_item.text
        
        # If we can't parse the response properly, return a default message
        return "I'm sorry, I couldn't generate a proper response. Please try again."
    
    except Exception as e:
        logging.error(f"Error generating AI response: {str(e)}")
        return f"Sorry, there was an error communicating with the AI service: {str(e)}"
