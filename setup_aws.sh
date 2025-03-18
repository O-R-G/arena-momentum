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

# Update system
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "sudo yum update -y"

# Install required packages
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "sudo yum install -y php php-cli python3 git"

# Create app directory
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "mkdir -p ~/arena-momentum"
scp -i "$KEY_PATH" -r ./* ec2-user@$EC2_IP:~/arena-momentum/

# Make start script executable
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "chmod +x ~/arena-momentum/start.sh"

# Create a systemd service file
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "sudo tee /etc/systemd/system/arena-momentum.service << EOF
[Unit]
Description=Arena Momentum Slideshow
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/arena-momentum
ExecStart=/home/ec2-user/arena-momentum/start.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF"

# Enable and start the service
ssh -i "$KEY_PATH" ec2-user@$EC2_IP "sudo systemctl enable arena-momentum && sudo systemctl start arena-momentum"

echo "Setup complete! The slideshow should now be running on http://$EC2_IP:8000" 