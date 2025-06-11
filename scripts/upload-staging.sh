#!/bin/bash

# Configuration
REMOTE_USER="diaarena"
REMOTE_HOST="216.146.208.144"
REMOTE_DIR="/public_html/staging.arena-momentum.org"
LOCAL_DIR="."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting upload to staging server...${NC}"

# Create remote directory if it doesn't exist
echo "Creating remote directory..."
ssh $REMOTE_USER@$REMOTE_HOST "sudo mkdir -p $REMOTE_DIR && sudo chown $REMOTE_USER:$REMOTE_USER $REMOTE_DIR"

# Upload files using rsync
echo "Uploading files to $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
rsync -avz --delete \
    --exclude '.DS_Store' \
    --exclude '.git' \
    --exclude 'arena-momentum.pem' \
    --exclude 'scripts/' \
    --exclude 'setup_aws.sh' \
    --exclude 'upload_cache.sh' \
    --exclude 'start.sh' \
    "$LOCAL_DIR/" \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

# Check if the upload was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Upload completed successfully!${NC}"
else
    echo -e "${RED}Upload failed!${NC}"
    exit 1
fi 