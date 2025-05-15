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

# Models that support reasoning summary capability
MODELS_WITH_REASONING_SUMMARY = ["o3", "o3-mini", "gpt-4.1", "gpt-4.1-mini"]

# Available Azure OpenAI deployment models - this would typically come from an API,
# but we're hardcoding for demonstration. In production, you'd fetch from Azure.
AVAILABLE_MODELS = [
    {"id": "gpt-4o", "name": "Azure GPT-4o", "description": "Latest and most capable Azure OpenAI model with vision support"},
    {"id": "gpt-4.1", "name": "Azure GPT-4.1", "description": "Azure OpenAI model with advanced capabilities and strong reasoning"},
    {"id": "gpt-4.1-mini", "name": "Azure GPT-4.1-mini", "description": "More efficient version of Azure GPT-4.1"},
    {"id": "o3", "name": "Azure O3", "description": "Azure OpenAI model with advanced reasoning and generation capabilities"},
    {"id": "o3-mini", "name": "Azure O3-mini", "description": "More efficient version of Azure O3"},
    {"id": "o1", "name": "Azure O1", "description": "Fast and efficient Azure OpenAI model for simpler tasks"}
]

def get_available_models():
    """Return the list of available models."""
    return AVAILABLE_MODELS

def get_openai_client():
    """Create and return an Azure OpenAI client."""
    try:
        if not AZURE_OPENAI_API_KEY or not AZURE_OPENAI_ENDPOINT:
            logging.error("Azure OpenAI API key or endpoint is missing")
            raise ValueError("Azure OpenAI API key or endpoint is missing")
            
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
            # Check if message has image attached
            if 'image' in message and message['image']:
                # Format as a message with image content
                formatted_messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": message['content']},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{message['image']}"
                            }
                        }
                    ]
                })
            else:
                # Standard text message
                formatted_messages.append({
                    "role": "user", 
                    "content": message['content']
                })
        elif message['role'] == 'assistant':
            formatted_messages.append({
                "role": "assistant", 
                "content": message['content']
            })
        elif message['role'] == 'developer':
            # Developer messages are like system messages but with a different role
            formatted_messages.append({
                "role": "developer", 
                "content": message['content']
            })
    
    return formatted_messages

def generate_ai_response(message, conversation_history=None, image_data=None, reasoning_effort=None, developer_message=None, model=None):
    """Generate an AI response using Azure OpenAI API.
    
    Args:
        message (str): The user's message
        conversation_history (list, optional): Previous conversation history
        image_data (str, optional): Base64-encoded image data
        reasoning_effort (str, optional): Reasoning effort level (low, medium, high)
        developer_message (str, optional): Developer message to include (like system message)
        model (str, optional): The deployment model ID to use, defaults to AZURE_OPENAI_DEPLOYMENT_NAME
    
    Returns:
        tuple: (response_text, reasoning_summary) where reasoning_summary is None if not supported
    """
    if conversation_history is None:
        conversation_history = []
    
    # Use specified model or the default
    deployment_name = model if model else AZURE_OPENAI_DEPLOYMENT_NAME
    
    try:
        client = get_openai_client()
        
        # Format conversation history for the API
        formatted_history = format_conversation_history(conversation_history)
        
        # Add developer message if provided
        if developer_message:
            formatted_history.insert(0, {
                "role": "developer",
                "content": developer_message
            })
        
        # Prepare the user input
        if image_data:
            # Create a message with both text and image
            user_message = {
                "role": "user",
                "content": [
                    {"type": "text", "text": message},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}"
                        }
                    }
                ]
            }
        else:
            # Standard text-only message
            user_message = {"role": "user", "content": message}
        
        # Prepare the input with history and new message
        input_messages = formatted_history + [user_message]
        
        # Get response from Azure OpenAI
        logging.debug(f"Sending request to Azure OpenAI using model {deployment_name} with {len(input_messages)} messages")
        
        # Set up parameters for the API call
        params = {
            "model": deployment_name,
            "input": input_messages
        }
        
        # Add reasoning effort parameter if provided
        if reasoning_effort:
            params["reasoning_effort"] = reasoning_effort
        
        # Make the API call
        response = client.responses.create(**params)
        
        # Variables for response
        response_text = None
        reasoning_summary = None
        
        # Extract the response text and reasoning summary
        if response.output and len(response.output) > 0:
            for output in response.output:
                if hasattr(output, 'role') and output.role == "assistant" and hasattr(output, 'content'):
                    # Extract text content
                    for content_item in output.content:
                        if content_item.type == "output_text":
                            response_text = content_item.text
                
            # Check for reasoning summary if model supports it
            current_model = deployment_name.lower()
            if any(model_name in current_model for model_name in MODELS_WITH_REASONING_SUMMARY):
                if hasattr(response, 'reasoning_summary'):
                    reasoning_summary = response.reasoning_summary
        
        # If we can't parse the response properly, return a default message
        if not response_text:
            response_text = "I'm sorry, I couldn't generate a proper response. Please try again."
        
        return response_text, reasoning_summary
    
    except Exception as e:
        logging.error(f"Error generating AI response: {str(e)}")
        return f"Sorry, there was an error communicating with the AI service: {str(e)}", None
        
def stream_ai_response(message, conversation_history=None, image_data=None, reasoning_effort=None, developer_message=None, model=None):
    """Stream an AI response using Azure OpenAI API.
    
    Args:
        message (str): The user's message
        conversation_history (list, optional): Previous conversation history
        image_data (str, optional): Base64-encoded image data
        reasoning_effort (str, optional): Reasoning effort level (low, medium, high)
        developer_message (str, optional): Developer message to include (like system message)
        model (str, optional): The deployment model ID to use, defaults to AZURE_OPENAI_DEPLOYMENT_NAME
        
    Returns:
        generator: A generator that yields chunks of the AI response as they become available
    """
    if conversation_history is None:
        conversation_history = []
    
    # Use specified model or the default
    deployment_name = model if model else AZURE_OPENAI_DEPLOYMENT_NAME
    
    try:
        client = get_openai_client()
        
        # Format conversation history for the API
        formatted_history = format_conversation_history(conversation_history)
        
        # Add developer message if provided
        if developer_message:
            formatted_history.insert(0, {
                "role": "developer",
                "content": developer_message
            })
        
        # Prepare the user input
        if image_data:
            # Create a message with both text and image
            user_message = {
                "role": "user",
                "content": [
                    {"type": "text", "text": message},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}"
                        }
                    }
                ]
            }
        else:
            # Standard text-only message
            user_message = {"role": "user", "content": message}
        
        # Prepare the input with history and new message
        input_messages = formatted_history + [user_message]
        
        # Get streaming response from Azure OpenAI
        logging.debug(f"Sending streaming request to Azure OpenAI using model {deployment_name} with {len(input_messages)} messages")
        
        # Set up parameters for the API call
        params = {
            "model": deployment_name,
            "input": input_messages,
            "stream": True  # Enable streaming
        }
        
        # Add reasoning effort parameter if provided
        if reasoning_effort:
            params["reasoning_effort"] = reasoning_effort
        
        # Make the API call
        response = client.responses.create(**params)
        
        # For streaming, we'll yield response text as it arrives
        # Reasoning summary will be yielded after all text if available
        reasoning_summary = None
        
        # Yield response chunks as they arrive
        for chunk in response:
            if chunk.type == 'response.output_text.delta':
                yield chunk.delta
            elif chunk.type == 'response.reasoning_summary':
                # Store the reasoning summary to be yielded at the end
                reasoning_summary = chunk.value
        
        # After all text chunks have been sent, if we have a reasoning summary,
        # we'll send a special message format to indicate it's a reasoning summary
        if reasoning_summary:
            yield f"\n\n<reasoning-summary>{reasoning_summary}</reasoning-summary>"
                
    except Exception as e:
        logging.error(f"Error streaming AI response: {str(e)}")
        yield f"Sorry, there was an error communicating with the AI service: {str(e)}"
