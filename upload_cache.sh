#!/bin/bash

# Check if required arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <path-to-key.pem> <ec2-public-ip>"
    echo "Example: $0 ~/.ssh/arena-momentum.pem ec2-1-2-3-4.compute-1.amazonaws.com"
    exit 1
fi

KEY_PATH=$1
EC2_IP=$2

# Create cache directory on EC2 if it doesn't exist
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "mkdir -p ~/arena-momentum/api/cache"

# Upload all files from local cache to EC2
echo "Uploading cache files..."
rsync -avz -e "ssh -i $KEY_PATH" \
    --progress \
    api/cache/ \
    ec2-user@$EC2_IP:~/arena-momentum/api/cache/

echo "Upload complete! Files are now in ~/arena-momentum/api/cache on the EC2 instance" 