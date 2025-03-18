#!/bin/bash

# Check if required arguments are provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <ec2-public-ip>"
    echo "Example: $0 ec2-1-2-3-4.compute-1.amazonaws.com"
    exit 1
fi

EC2_IP=$1
KEY_PATH="arena-momentum.pem"

# Make sure the key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo "Error: Key file $KEY_PATH not found!"
    exit 1
fi

# Set correct permissions for the key file
chmod 400 "$KEY_PATH"

# Create cache directory on EC2 if it doesn't exist
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "mkdir -p ~/arena-momentum/api/cache"

# Upload all files from local cache to EC2
echo "Uploading cache files..."
rsync -avz -e "ssh -i $KEY_PATH" \
    --progress \
    api/cache/ \
    ec2-user@$EC2_IP:~/arena-momentum/api/cache/

echo "Upload complete! Files are now in ~/arena-momentum/api/cache on the EC2 instance"

# Set correct permissions on the uploaded files
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "sudo chown -R ec2-user:ec2-user ~/arena-momentum/api/cache"

# Restart the service to pick up new files
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "sudo systemctl restart arena-momentum" 