# Stage 1: Build the Angular application
FROM node:20-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist/crux-design/browser /usr/share/nginx/html

# Copy custom nginx configuration - make sure it's actually copying
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script
COPY ./startup.sh /startup.sh
RUN chmod +x /startup.sh

# Expose port
EXPOSE 80

CMD ["/startup.sh"]