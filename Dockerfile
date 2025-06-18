# Use Node 20 base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy dependencies and install them
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Start Vite server
CMD ["npm", "run", "dev", "--", "--host"]
