#!/bin/bash

# Start PHP development server
php -S 0.0.0.0:8000

# If PHP server fails, fall back to Python's simple HTTP server
if [ $? -ne 0 ]; then
    echo "PHP server failed, falling back to Python server..."
    python3 -m http.server 8000
fi 