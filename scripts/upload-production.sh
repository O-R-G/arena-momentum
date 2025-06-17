#!/bin/bash

# Configuration
REMOTE_USER="diaarena"
REMOTE_HOST="216.146.208.144"
REMOTE_DIR="~/public_html/arena-momentum.org"
LOCAL_DIR="."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dry-run is requested
DRY_RUN=""
if [ "$1" == "--dry-run" ]; then
    DRY_RUN="--dry-run"
    echo -e "${YELLOW}Running in dry-run mode - no files will be modified${NC}"
fi

echo -e "${GREEN}Starting upload to production server...${NC}"

# Check if remote directory exists and is writable
echo "Checking remote directory..."
if ! ssh $REMOTE_USER@$REMOTE_HOST "[ -d $REMOTE_DIR ] && [ -w $REMOTE_DIR ]"; then
    echo -e "${RED}Error: Directory $REMOTE_DIR either doesn't exist or is not writable.${NC}"
    echo -e "${YELLOW}Please ensure the directory exists and has correct permissions on the server.${NC}"
    exit 1
fi

# Upload files using rsync
echo "Uploading files to $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
rsync -avz $DRY_RUN \
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
    if [ "$DRY_RUN" == "--dry-run" ]; then
        echo -e "${GREEN}Dry run completed successfully! No files were modified.${NC}"
    else
        echo -e "${GREEN}Upload completed successfully!${NC}"
    fi
else
    echo -e "${RED}Upload failed!${NC}"
    exit 1
fi 