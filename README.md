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

## Development

1. Clone the repository
2. Install dependencies
3. Run the development server
4. Open multiple browser windows to test synchronization

## License

[License information here]

