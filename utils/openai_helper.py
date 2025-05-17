import os
import logging
import json
from openai import AzureOpenAI

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Get environment variables for Azure OpenAI
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.environ.get("AZURE_OPENAI_API_VERSION", "2025-04-01-preview")
AZURE_OPENAI_DEPLOYMENT_NAME = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")

# Models that support reasoning summary capability - currently only o3 and o4-mini
MODELS_WITH_REASONING_SUMMARY = ["o3", "o4-mini"]

# Available Azure OpenAI deployment models - this would typically come from an API,
# but we're hardcoding for demonstration. In production, you'd fetch from Azure.
AVAILABLE_MODELS = [
    {"id": "gpt-4o", "name": "Azure GPT-4o", "description": "Latest and most capable Azure OpenAI model with vision support"},
    {"id": "gpt-4.1", "name": "Azure GPT-4.1", "description": "Azure OpenAI model with advanced capabilities and strong reasoning"},
    {"id": "gpt-4.1-mini", "name": "Azure GPT-4.1-mini", "description": "More efficient version of Azure GPT-4.1"},
    {"id": "o4-mini", "name": "Azure O4-mini", "description": "Azure OpenAI o-series model with reasoning summary capabilities"},
    {"id": "o3", "name": "Azure O3", "description": "Azure OpenAI model with advanced reasoning and generation capabilities"},
    {"id": "o3-mini", "name": "Azure O3-mini", "description": "More efficient version of Azure O3"},
    {"id": "o1", "name": "Azure O1", "description": "Fast and efficient Azure OpenAI model for scientific reasoning"},
    {"id": "o1-mini", "name": "Azure O1-mini", "description": "More efficient version of Azure O1 for faster reasoning tasks"}
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
        # Log successful client creation
        logging.info(f"Successfully created Azure OpenAI client with endpoint: {AZURE_OPENAI_ENDPOINT}")
        logging.info(f"Using API version: {AZURE_OPENAI_API_VERSION}")
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
    """Generate an AI response using Azure OpenAI Chat Completions API or Responses API.
    
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
        
        # Check if model supports reasoning summary
        is_reasoning_model = any(model_name in deployment_name.lower() for model_name in MODELS_WITH_REASONING_SUMMARY)
        
        # Use the Responses API for models that support reasoning summary
        if is_reasoning_model and reasoning_effort:
            logging.info(f"Using Responses API for model {deployment_name} with reasoning effort {reasoning_effort}")
            
            # Prepare the input for the Responses API
            if developer_message:
                input_content = [
                    {"role": "developer", "content": developer_message},
                    {"role": "user", "content": message}
                ]
            else:
                # If image provided, use multimodal content
                if image_data:
                    input_content = {
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
                    input_content = message
            
            # Add formatted history if we have it
            if formatted_history:
                input_content = formatted_history + [{"role": "user", "content": message}]
            
            # Set up reasoning parameters
            reasoning_params = {
                "effort": reasoning_effort,
                "summary": "detailed"  # Can be "auto", "concise", or "detailed"
            }
            
            # Make the API call to the Responses API
            try:
                response = client.responses.create(
                    model=deployment_name,
                    input=input_content,
                    reasoning=reasoning_params
                )
                
                # Extract the response text and reasoning summary
                response_text = ""
                if hasattr(response, "output") and response.output:
                    for output in response.output:
                        if hasattr(output, "role") and output.role == "assistant":
                            for content in output.content:
                                if content.type == "text":
                                    response_text = content.text
                                    break
                
                # Extract reasoning summary if available
                reasoning_summary = None
                if hasattr(response, "reasoning") and response.reasoning:
                    reasoning_summary = response.reasoning
                
                # If we couldn't get the text response from the expected structure,
                # try fallback approaches
                if not response_text and hasattr(response, "output_text"):
                    response_text = response.output_text
                
                return response_text, reasoning_summary
                
            except Exception as e:
                logging.error(f"Error using Responses API, falling back to Chat Completions: {str(e)}")
                # Fall back to the Chat Completions API if the Responses API fails
                # This will be handled by the chat completions code below
        
        # Default to Chat Completions API for models without reasoning summary or if Responses API failed
        # Handle image if provided
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
            formatted_history.append(user_message)
        else:
            # Add developer message if provided
            if developer_message:
                formatted_history.insert(0, {
                    "role": "system",
                    "content": developer_message
                })
            
            # Add current user message
            formatted_history.append({
                "role": "user",
                "content": message
            })
        
        # Log the request
        logging.debug(f"Sending request to Azure OpenAI Chat Completions using model {deployment_name}")
        
        # For o-series models, use max_completion_tokens instead of max_tokens
        # Only include these parameters for o-series models
        if "o" in deployment_name.lower():
            # Make the API call with o-series parameters
            response = client.chat.completions.create(
                model=deployment_name,
                messages=formatted_history,
                max_completion_tokens=800  # o-series models use this parameter
            )
            if reasoning_effort:
                # If we're here with a reasoning effort but not using Responses API,
                # log that reasoning summary is not available
                logging.info(f"Using reasoning_effort={reasoning_effort} without Responses API - summary not available")
        else:
            # Standard parameters for GPT models
            response = client.chat.completions.create(
                model=deployment_name,
                messages=formatted_history,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1,
                max_tokens=800
            )
        
        # Extract the response text
        response_text = ""
        if response.choices and len(response.choices) > 0:
            response_text = response.choices[0].message.content
        
        # No reasoning summary in Chat Completions API
        reasoning_summary = None
        
        # If we can't parse the response properly, return a default message
        if not response_text:
            response_text = "I'm sorry, I couldn't generate a proper response. Please try again."
        
        return response_text, reasoning_summary
    
    except Exception as e:
        logging.error(f"Error generating AI response: {str(e)}")
        return f"Sorry, there was an error communicating with the AI service: {str(e)}", None
        
def stream_ai_response(message, conversation_history=None, image_data=None, reasoning_effort=None, developer_message=None, model=None):
    """Stream an AI response using Azure OpenAI Chat Completions API.
    
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
    
    # Check if this is a model that doesn't support streaming
    if "o3" in deployment_name.lower():
        logging.warning(f"Model {deployment_name} does not support streaming. Using non-streaming API instead.")
        # For o3 model, we'll use the non-streaming API and simulate streaming
        try:
            response_text, reasoning_summary = generate_ai_response(
                message, 
                conversation_history,
                image_data,
                reasoning_effort,
                developer_message,
                model
            )
            
            # Simulate streaming by chunking the response
            chunk_size = 10
            for i in range(0, len(response_text), chunk_size):
                yield response_text[i:i+chunk_size]
                
            # If we have a reasoning summary, add it as a special message at the end
            if reasoning_summary:
                yield f"\n\n<reasoning-summary>{reasoning_summary}</reasoning-summary>"
                
            return
        except Exception as e:
            logging.error(f"Error getting non-streaming response for o3 model: {str(e)}")
            yield f"Sorry, there was an error communicating with the AI service: {str(e)}"
            return
    
    try:
        client = get_openai_client()
        
        # Format conversation history for the API
        formatted_history = format_conversation_history(conversation_history)
        
        # Prepare the message content
        message_content = message
        
        # Handle image if provided
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
            formatted_history.append(user_message)
        else:
            # Add developer message if provided
            if developer_message:
                formatted_history.insert(0, {
                    "role": "system",
                    "content": developer_message
                })
            
            # Add current user message
            formatted_history.append({
                "role": "user",
                "content": message_content
            })
        
        # Log the streaming request
        logging.debug(f"Sending streaming request to Azure OpenAI using model {deployment_name}")
        
        # For o-series models, use max_completion_tokens instead of max_tokens
        if "o" in deployment_name.lower():
            # Make API call with o-series parameters
            response = client.chat.completions.create(
                model=deployment_name,
                messages=formatted_history,
                stream=True,
                max_completion_tokens=800  # o-series models use this parameter
            )
        else:
            # Standard parameters for GPT models
            response = client.chat.completions.create(
                model=deployment_name,
                messages=formatted_history,
                stream=True,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1,
                max_tokens=800
            )
        
        # Collect and yield the streamed response
        collected_chunks = []
        for chunk in response:
            if chunk.choices and len(chunk.choices) > 0:
                content = chunk.choices[0].delta.content
                if content is not None:
                    collected_chunks.append(content)
                    yield content
        
        # No support for reasoning summary in the streaming implementation
                
    except Exception as e:
        logging.error(f"Error streaming AI response: {str(e)}")
        yield f"Sorry, there was an error communicating with the AI service: {str(e)}"
