# Are.na Momentum

This project creates a synchronized slideshow from Are.na channels. It fetches content daily from a specified Are.na profile, generates a schedule, and displays the content in a synchronized way across multiple devices.

## Setup

1. Clone this repository:
   ```bash
   git clone [repository-url]
   cd [repository-name]
   ```

2. Create required directories:
   ```bash
   mkdir -p api/data api/cache
   touch api/data/.gitkeep api/cache/.gitkeep
   ```

3. Copy the config template and edit it with your settings:
   ```bash
   cp api/config.template.php api/config.php
   ```

4. Edit `api/config.php` and add:
   - Your Are.na access token (get it from https://dev.are.na/oauth/applications)
   - Your Are.na user ID (the user ID of the account you want to fetch content from)
   - Adjust other settings as needed

5. Test your configuration:
   ```bash
   php api/example_usage.php
   ```
   If successful, you should see the configured slide duration printed.

6. Generate the daily schedule:
   ```bash
   php api/generate_schedule.php
   ```
   This will fetch all channels, collect image blocks, and create a randomized daily schedule.

## Project Structure

- `api/` - Backend PHP scripts
  - `bootstrap.php` - Loads and validates configuration
  - `config.template.php` - Template for configuration settings
  - `config.php` - Your actual configuration (git-ignored)
  - `data/` - Directory for generated schedules
  - `cache/` - Directory for cached images

## Configuration Options

- `arena.access_token` - Your Are.na API access token
- `arena.group_id` - ID of the Are.na group containing channels
- `display.slide_duration` - How long each slide shows (in seconds)
- `display.preload_count` - Number of upcoming slides to preload
- `paths.schedule_file` - Where the daily schedule is stored
- `paths.cache_dir` - Where downloaded images are cached

## Running

Start a local PHP server:
```bash
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

---

## Time Synchronization

The system uses a precise time synchronization mechanism to ensure all clients display the same content at the same time. Here's how it works:

### Server Time

- The server provides Unix timestamps (seconds since epoch) via `/api/time.php`
- Each slide in the schedule has a Unix timestamp indicating when it should be shown
- The schedule is generated daily and ensures all visitors see the same content at the same time

### Client Synchronization

The `Time` class handles client-side time synchronization:

```javascript
class Time {
  constructor() {
    this.serverTimeOffset = 0;  // Difference between client and server time
    this.syncInterval = 15000;  // Sync every 15 seconds
    this.syncWindow = 100;      // Accept 100ms difference
    this.syncHistory = [];      // Track last 10 sync attempts
  }
}
```

#### How it works:

1. **Initial Sync**
   - Client requests server time
   - Calculates offset between client and server time
   - Accounts for network latency
   - Stores offset for future time calculations

2. **Periodic Sync**
   - Syncs every 15 seconds
   - Uses average of last 3 syncs for stability
   - Retries if time difference is too large
   - Maintains sync history for debugging

3. **Time Calculations**
   - Server time is in seconds (Unix timestamp)
   - Client uses `performance.now()` in milliseconds
   - Converts between units as needed
   - Accounts for network latency in calculations

4. **Error Handling**
   - Validates server responses
   - Retries failed syncs
   - Maintains sync stability
   - Provides detailed error logging

### Usage

```javascript
const time = new Time();

// Get current time (in seconds)
const now = time.getCurrentTime();

// Wait for stable sync before starting
await time.waitForStableSync();

// Start periodic sync
time.startPeriodicSync();
```

### Debugging

The system provides detailed logging for debugging sync issues:

```javascript
// Get current sync state
const state = time.getSyncState();
console.log(state);
// {
//   offset: number,      // Current time offset
//   lastSync: number,    // Last sync timestamp
//   isStable: boolean,   // Whether sync is stable
//   attempts: number,    // Number of sync attempts
//   history: Array      // Last 10 sync attempts
// }
```

## Schedule

The schedule is stored in `schedule.json` and contains:

```json
{
  "metadata": {
    "slide_duration": 30,    // Seconds per slide
    "preload_count": 3       // Number of slides to preload
  },
  "schedule": [
    {
      "timestamp": 1234567890,  // Unix timestamp
      "time": "12:34:56",       // Human readable time
      "block": {
        "id": "123456",
        "type": "Image|Media",
        "title": "Slide Title",
        "channel_title": "Channel Name",
        "image_url": "https://...",
        "embed_html": "<iframe...>"
      }
    }
  ]
}
```

## Deployment

The project includes scripts for deploying to both staging and production environments on Pair.com.

### Prerequisites

1. SSH Key Setup:
   - Generate an SSH key if you don't have one:
     ```bash
     ssh-keygen -t ed25519 -C "your_email@example.com"
     ```
   - Add your public key to Pair.com:
     - Log in to your Pair.com control panel
     - Go to SSH Keys section
     - Add your public key (contents of `~/.ssh/id_ed25519.pub`)
   - Test your SSH connection:
     ```bash
     ssh diaarena@216.146.208.144
     ```

### Deployment Scripts

The project includes two deployment scripts:

1. Staging Deployment:
   ```bash
   # Preview changes without uploading
   ./scripts/upload-staging.sh --dry-run
   
   # Deploy to staging
   ./scripts/upload-staging.sh
   ```

2. Production Deployment:
   ```bash
   # Preview changes without uploading
   ./scripts/upload-production.sh --dry-run
   
   # Deploy to production
   ./scripts/upload-production.sh
   ```

Both scripts will:
- Check if the target directory exists and is writable
- Upload all files except:
  - `.DS_Store`
  - `.git`
  - `arena-momentum.pem`
  - `scripts/`
  - `setup_aws.sh`
  - `upload_cache.sh`
  - `start.sh`

The staging site is available at: https://staging.arena-momentum.org
The production site is available at: https://arena-momentum.org

## Monitoring

The project uses UptimeRobot for server monitoring. This provides free, reliable monitoring of both staging and production environments.

### Health Check Endpoint

A health check endpoint is available at `/api/health.php`. It verifies:
- Are.na API connectivity
- Schedule file existence and validity
- Returns appropriate HTTP status codes (200 for healthy, 503 for unhealthy)

Example response:
```json
{
    "status": "healthy",
    "timestamp": 1234567890,
    "checks": {
        "arena_api": {
            "status": "healthy",
            "message": "Are.na API connection successful"
        },
        "schedule": {
            "status": "healthy",
            "message": "Schedule file exists and is valid"
        }
    }
}
```

### Setting Up UptimeRobot

1. Create a free account at [UptimeRobot](https://uptimerobot.com)
2. Add new monitors for:
   - Production site: https://arena-momentum.org
   - Staging site: https://staging.arena-momentum.org
   - Production health check: https://arena-momentum.org/api/health.php
   - Staging health check: https://staging.arena-momentum.org/api/health.php

3. Configure each monitor:
   - Type: HTTP(s)
   - Check interval: 5 minutes
   - Alert when down: 1 time
   - Alert when up: 1 time
   - For health check endpoints, set "Alert when down" to 1 time and "Alert when up" to 1 time

4. Set up notifications:
   - Add your email address
   - Optionally add SMS notifications
   - Configure alert thresholds

### Monitoring Dashboard

UptimeRobot provides a public status page that you can share with stakeholders. To set it up:

1. Go to Settings → Status Pages
2. Create a new status page
3. Add your monitors
4. Customize the appearance
5. Share the status page URL

The status page will show:
- Current status of all monitored endpoints
- Uptime history
- Response times
- Recent incidents


