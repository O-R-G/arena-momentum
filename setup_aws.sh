#!/bin/bash

# Update system
sudo yum update -y

# Install required packages
sudo yum install -y php php-cli python3 git

# Create app directory
mkdir -p ~/arena-momentum
cd ~/arena-momentum

# Clone your repository (replace with your actual repository URL)
git clone https://github.com/O-R-G/arena-momentum.git .

# Make start script executable
chmod +x start.sh

# Create a systemd service file
sudo tee /etc/systemd/system/arena-momentum.service << EOF
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
EOF

# Enable and start the service
sudo systemctl enable arena-momentum
sudo systemctl start arena-momentum

echo "Setup complete! The slideshow should now be running on http://YOUR_EC2_PUBLIC_IP:8000" 