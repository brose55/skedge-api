# Use the official Node.js image 
FROM node:22

# Enable Corepack
RUN corepack enable

# Install build tools for native dependencies (on Debian-based images)
RUN apt-get update && apt-get install -y build-essential python3 g++

# Create and set the working directory
WORKDIR /app

# Copy package.json and yarn.lock before other files to leverage Docker caching
COPY package.json package-lock.json ./

# Set environment variable to production to avoid installing devDependencies
ENV NODE_ENV=production

# Install dependencies (including any workspace dependencies if applicable)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

# Expose the application's port (adjust if necessary)
EXPOSE 3000

# Start the application
CMD ["node", "build/src/app.js"]
