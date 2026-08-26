FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose Render PORT
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Start server
CMD ["node", "src/index.js"]
