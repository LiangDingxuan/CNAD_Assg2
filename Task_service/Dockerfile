# task_service/Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 3002

# Command to run the application
CMD ["node", "index.js"]