# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install project dependencies
# Assuming npm, adjust if using yarn or pnpm
RUN npm ci

# Copy the rest of the application code into the container
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your app
CMD ["npm", "run", "dev"] 