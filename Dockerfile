# Use a lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the Vite static assets and compile the server.ts file using esbuild
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose port (Cloud Run dynamically overrides this via PORT env variable)
EXPOSE 3000

# Start the Node.js Express server
CMD ["npm", "start"]
