# Use the official Node.js Alpine image
FROM node:alpine

# 1. Install Docker Client
# 'apk update' updates the package list
# 'apk add docker' installs the docker CLI client
RUN apk update && \
    apk add docker && \
    rm -rf /var/cache/apk/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json .
# Install Express and other dependencies
RUN npm install

# Copy the server script and the public UI directory
COPY mc-server-manager.js .
COPY public/ public/

# The port Express runs on
EXPOSE 3000

# The CMD remains the same
CMD ["npm", "start"]