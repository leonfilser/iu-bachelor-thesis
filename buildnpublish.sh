#!/bin/bash
set -e

echo "Starting build process..."

# Building the backend Docker image
echo "Building backend..."
if docker build -t leonfilser/iu-bachelor-thesis-backend:latest ${PWD}/backend/; then
    echo "Backend image built successfully"
    echo "Pushing backend image to registry..."

    if docker push leonfilser/iu-bachelor-thesis-backend:latest; then
        echo "Backend image pushed successfully"
    else
        echo "Failed to push backend image" >&2
        exit 1
    fi

else
    echo "Backend build failed" >&2
    exit 1
fi