# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci

# Copy source code
COPY . .

# Create uploads directory for multer
RUN mkdir -p uploads

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
