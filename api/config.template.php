<?php
return [
    // Are.na API configuration
    'arena' => [
        'access_token' => 'YOUR_ACCESS_TOKEN_HERE',
        'group_id' => 'YOUR_GROUP_ID_HERE',
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
        'schedule_file' => __DIR__ . '/data/schedule.txt',
        // Cache directory for downloaded images
        'cache_dir' => __DIR__ . '/cache'
    ]
]; 