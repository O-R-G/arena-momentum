<?php

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/vimeo_api.php';

// Test with a real Vimeo video ID from the schedule
$test_video_id = '1056936869'; // From "NINJAV_S001_S001_T005-4K_02_51_52_14"
$test_title = 'test_vimeo_video';

try {
    $config = require __DIR__ . '/config.php';
    
    // Check if Vimeo API is configured
    if (!isset($config['vimeo']['access_token']) || $config['vimeo']['access_token'] === 'YOUR_VIMEO_ACCESS_TOKEN_HERE') {
        echo "Vimeo API not configured. Please add your Vimeo API credentials to config.php\n";
        exit(1);
    }
    
    echo "Testing Vimeo API integration...\n";
    echo "Config loaded successfully.\n";
    
    // Initialize Vimeo API
    $vimeo = new VimeoAPI($config);
    echo "Vimeo API client initialized.\n";
    
    // Test video info retrieval
    echo "\nTesting video info retrieval...\n";
    $video_info = $vimeo->getVideoInfo($test_video_id);
    
    if ($video_info) {
        echo "✅ Video info retrieved successfully!\n";
        echo "Title: " . ($video_info['name'] ?? 'Unknown') . "\n";
        echo "Duration: " . ($video_info['duration'] ?? 'Unknown') . " seconds\n";
        
        // Test download URL retrieval
        echo "\nTesting download URL retrieval...\n";
        $download_url = $vimeo->getDownloadUrl($test_video_id);
        
        if ($download_url) {
            echo "✅ Download URL retrieved successfully!\n";
            echo "URL: " . substr($download_url, 0, 100) . "...\n";
            
            // Test actual download (small test)
            echo "\nTesting video download...\n";
            $cache_dir = $config['paths']['cache_dir'];
            $filename = $test_title . '.mp4';
            
            $filepath = $vimeo->downloadVideo($test_video_id, $filename, $cache_dir);
            
            if ($filepath) {
                echo "✅ Video downloaded successfully!\n";
                echo "File saved to: $filepath\n";
                echo "File size: " . number_format(filesize($filepath) / 1024 / 1024, 2) . " MB\n";
            } else {
                echo "❌ Video download failed.\n";
            }
        } else {
            echo "❌ Could not retrieve download URL.\n";
        }
    } else {
        echo "❌ Could not retrieve video info.\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\nTest completed!\n"; 