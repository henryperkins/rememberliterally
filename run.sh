#!/bin/bash

# Set required environment variables if not already set
export AZURE_OPENAI_API_VERSION=${AZURE_OPENAI_API_VERSION:-"2025-04-01-preview"}
export AZURE_OPENAI_DEPLOYMENT_NAME=${AZURE_OPENAI_DEPLOYMENT_NAME:-"gpt-4o"}
export PORT=8080

# Run the Flask application
python main.py