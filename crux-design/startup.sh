#!/bin/sh

# Display the content of the nginx configuration file
echo "Current nginx configuration:"
cat /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"