
#!/bin/bash
# Deployment script for Azure AI Chat application

# Step 1: Build Tailwind CSS
echo "Building Tailwind CSS..."
npx tailwindcss -i ./static/css/tailwind-input.css -o ./static/css/styles.css --minify

# Step 2: Start the Gunicorn server
echo "Starting Gunicorn server..."
gunicorn --bind 0.0.0.0:5000 --reuse-port app:app
