# Use official Nginx image as base
FROM nginx:alpine

# Copy local files (index.html) to Nginx default HTML folder
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
