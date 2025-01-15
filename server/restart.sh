#!/bin/bash

# Configuration
RESTART_EXIT_CODE=42      # Exit code that triggers a restart


echo "Starting server with auto-restart (max $MAX_RESTARTS restarts)..."

while true; do
    # Build and run the server
    echo "Building and starting server..."
    cd .. && npm run build && cd server && go build -o main main.go && ./main

    # Capture the exit code of the server
    EXIT_CODE=$?
    echo "Server exited with code: $EXIT_CODE"

    # Check if the exit code matches the restart condition
    if [ $EXIT_CODE -ne $RESTART_EXIT_CODE ]; then
        echo "Server exited with a non-restart code. Stopping."
        break
    fi

done