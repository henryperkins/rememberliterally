#!/bin/bash

# Kill any running instances
pkill -f "python main.py" || true

# Start the app in the background
nohup python main.py > app.log 2>&1 &

echo "Application started! Access it at https://replit.com/@yourusername/yourapplication"
echo "You can check the logs with: tail -f app.log"