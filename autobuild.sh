#!/bin/bash

CONTAINER_NAME=minimal-fastify-container
IMAGE_NAME=minimal-fastify

docker build -t $IMAGE_NAME .

# Stop the container if it's running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping container..."
    docker stop $CONTAINER_NAME
fi

# Remove the container if it exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Removing container..."
    docker rm $CONTAINER_NAME
fi

# Run a new container
echo "Starting new container..."
docker run -dit \
  --shm-size=8g \
  -v ./public:/app/public \
  -v ./storage:/app/storage \
  -p 9000:9000 \
  --name $CONTAINER_NAME \
  $IMAGE_NAME

