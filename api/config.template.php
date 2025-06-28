<?php
return [
  // Are.na API configuration
  'arena' => [
    'access_token' => 'YOUR_ACCESS_TOKEN_HERE',
    'user_id' => 'YOUR_USER_ID_HERE',
  ],
  
  // Vimeo API configuration
  'vimeo' => [
    'client_id' => 'YOUR_VIMEO_CLIENT_ID_HERE',
    'client_secret' => 'YOUR_VIMEO_CLIENT_SECRET_HERE',
    'access_token' => 'YOUR_VIMEO_ACCESS_TOKEN_HERE',
  ],
  
  // Display settings
  'display' => [
    // Duration for each slide in seconds
    'slide_duration' => 30,
    // Number of slides to preload
    'preload_count' => 3
  ],
  
  // File paths
  'paths' => [
    // Where to store the daily schedule
    'schedule_file' => __DIR__ . '/data/schedule.json',
    // Cache directory for downloaded images
    'cache_dir' => __DIR__ . '/cache'
  ]
]; 