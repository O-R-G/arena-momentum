# Are.na Momentum

This project creates a synchronized slideshow from Are.na channels. It fetches content daily from a specified Are.na group, generates a schedule, and displays the content in a synchronized way across multiple devices.

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
   - Your Are.na group ID
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

