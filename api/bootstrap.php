<?php

if (!file_exists(__DIR__ . '/config.php')) {
    die('Please copy config.template.php to config.php and update the configuration.');
}

$config = require __DIR__ . '/config.php';

// Create required directories if they don't exist
$directories = [
    $config['paths']['cache_dir'],
    dirname($config['paths']['schedule_file'])
];

foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Function to help validate config
function validateConfig($config) {
    $required = [
        'arena.access_token',
        'arena.group_id',
        'display.slide_duration',
        'display.preload_count',
        'paths.schedule_file',
        'paths.cache_dir'
    ];
    
    foreach ($required as $path) {
        $parts = explode('.', $path);
        $current = $config;
        foreach ($parts as $part) {
            if (!isset($current[$part])) {
                throw new Exception("Missing required config: {$path}");
            }
            $current = $current[$part];
        }
    }
}

// Validate config on load
validateConfig($config);

return $config; 