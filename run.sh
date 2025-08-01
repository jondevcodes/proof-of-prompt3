#!/bin/bash

# Set default port
PORT=8000

echo "Starting server on port $PORT"
uvicorn main:app --host 0.0.0.0 --port $PORT