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

# Building the frontend Docker image
echo "Building frontend..."
if docker build -t leonfilser/iu-bachelor-thesis-frontend:latest ${PWD}/frontend/; then
    echo "Frontend image built successfully"
    echo "Pushing frontend image to registry..."

    if docker push leonfilser/iu-bachelor-thesis-frontend:latest; then
        echo "Frontend image pushed successfully"
    else
        echo "Failed to push frontend image" >&2
        exit 1
    fi

else
    echo "Frontend build failed" >&2
    exit 1
fi