<?php

require __DIR__ . '/fetch_arena.php';
require __DIR__ . '/vimeo_api.php';

class ScheduleGenerator {
  private $arena;
  private $vimeo;
  private $config;
  
  public function __construct($config) {
    $this->config = $config;
    $this->arena = new ArenaAPI(
      $config['arena']['access_token'],
      $config['arena']['user_id']
    );
    
    // Initialize Vimeo API if credentials are provided
    if (isset($config['vimeo']['access_token']) && $config['vimeo']['access_token'] !== 'YOUR_VIMEO_ACCESS_TOKEN_HERE') {
      $this->vimeo = new VimeoAPI($config);
    } else {
      echo "Vimeo API credentials not configured, skipping Vimeo downloads\n";
      $this->vimeo = null;
    }
  }
  
  private function getDateSeed() {
    // Use current date as seed for consistent shuffling
    return date('Y-m-d');
  }
  
  private function ensureCacheDirectory() {
    $cache_dir = $this->config['paths']['cache_dir'];
    if (!file_exists($cache_dir)) {
      mkdir($cache_dir, 0755, true);
      echo "Created cache directory: {$cache_dir}\n";
    }
  }
  
  private function downloadFile($url, $filename) {
    $this->ensureCacheDirectory();
    
    $cache_dir = $this->config['paths']['cache_dir'];
    $filepath = $cache_dir . '/' . $filename;
    
    // Skip if file already exists
    if (file_exists($filepath)) {
      echo "File already exists: {$filename}\n";
      return $filepath;
    }
    
    echo "Downloading: {$filename}\n";
    
    // Create a cURL handle
    $ch = curl_init($url);
    $fp = fopen($filepath, 'wb');
    
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300); // 5 minute timeout
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; ArenaMomentum/1.0)');
    
    $success = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    curl_close($ch);
    fclose($fp);
    
    if (!$success || $http_code !== 200) {
      // Remove the file if download failed
      if (file_exists($filepath)) {
        unlink($filepath);
      }
      echo "Failed to download {$filename} (HTTP {$http_code})\n";
      return null;
    }
    
    echo "Successfully downloaded: {$filename}\n";
    return $filepath;
  }
  
  private function normalizeFilename($title, $extension) {
    // Normalize the block title to create a safe filename
    $normalized = strtolower($title);
    $normalized = preg_replace('/[^a-z0-9_\-]/', '_', $normalized);
    $normalized = preg_replace('/_+/', '_', $normalized); // Replace multiple underscores with single
    $normalized = trim($normalized, '_'); // Remove leading/trailing underscores
    
    // Limit length to avoid filesystem issues
    if (strlen($normalized) > 100) {
      $normalized = substr($normalized, 0, 100);
    }
    
    return $normalized . '.' . $extension;
  }
  
  private function attemptDownload($block) {
    $local_file = null;
    
    try {
      if ($block['type'] === 'Image' && isset($block['image_url'])) {
        // Download image
        $extension = 'jpg'; // Default to jpg
        
        // Try to detect extension from URL
        if (preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $block['image_url'], $matches)) {
          $extension = strtolower($matches[1]);
        }
        
        $filename = $this->normalizeFilename($block['title'], $extension);
        $filepath = $this->downloadFile($block['image_url'], $filename);
        
        if ($filepath) {
          $local_file = str_replace(__DIR__, '', $filepath);
          // Ensure the path starts with /api
          if (strpos($local_file, '/api') !== 0) {
            $local_file = '/api' . $local_file;
          }
        }
        
      } elseif ($block['type'] === 'Attachment' && isset($block['video_url'])) {
        // Download video attachment
        $extension = 'mp4'; // Default for video attachments
        
        // Try to detect extension from URL or content type
        if (preg_match('/\.(mp4|mov|avi|mkv|webm)$/i', $block['video_url'], $matches)) {
          $extension = strtolower($matches[1]);
        } elseif (isset($block['content_type'])) {
          // Map content type to extension
          $content_type_map = [
            'video/mp4' => 'mp4',
            'video/quicktime' => 'mov',
            'video/x-msvideo' => 'avi',
            'video/x-matroska' => 'mkv',
            'video/webm' => 'webm'
          ];
          if (isset($content_type_map[$block['content_type']])) {
            $extension = $content_type_map[$block['content_type']];
          }
        }
        
        $filename = $this->normalizeFilename($block['title'], $extension);
        $filepath = $this->downloadFile($block['video_url'], $filename);
        
        if ($filepath) {
          $local_file = str_replace(__DIR__, '', $filepath);
          // Ensure the path starts with /api
          if (strpos($local_file, '/api') !== 0) {
            $local_file = '/api' . $local_file;
          }
        }
        
      } elseif ($block['type'] === 'Media' && isset($block['source_url'])) {
        // Handle Vimeo videos using the Vimeo API
        if (preg_match('/vimeo\.com\/(\d+)/', $block['source_url'], $matches)) {
          $video_id = $matches[1];
          
          if ($this->vimeo) {
            // Use Vimeo API to download the video
            $filename = $this->normalizeFilename($block['title'], 'mp4');
            $cache_dir = $this->config['paths']['cache_dir'];
            $this->ensureCacheDirectory();
            
            try {
              $filepath = $this->vimeo->downloadVideo($video_id, $filename, $cache_dir);
              
              if ($filepath) {
                $local_file = str_replace(__DIR__, '', $filepath);
                // Ensure the path starts with /api
                if (strpos($local_file, '/api') !== 0) {
                  $local_file = '/api' . $local_file;
                }
                echo "Successfully downloaded Vimeo video: {$block['title']}\n";
              } else {
                echo "Vimeo download failed for: {$block['title']}, falling back to embed\n";
                $local_file = null; // This will cause frontend to use vimeo_url
              }
            } catch (Exception $e) {
              echo "Vimeo API error for {$block['title']}: " . $e->getMessage() . ", falling back to embed\n";
              $local_file = null; // This will cause frontend to use vimeo_url
            }
          } else {
            // Fallback: check if we have existing cached files
            $normalized_title = $this->normalizeFilename($block['title'], 'mp4');
            $cache_dir = $this->config['paths']['cache_dir'];
            $possible_files = [
              $cache_dir . '/' . $normalized_title,
              $cache_dir . '/' . str_replace('.mp4', ' (720p).mp4', $normalized_title)
            ];
            
            foreach ($possible_files as $file) {
              if (file_exists($file)) {
                $local_file = str_replace(__DIR__, '', $file);
                // Ensure the path starts with /api
                if (strpos($local_file, '/api') !== 0) {
                  $local_file = '/api' . $local_file;
                }
                echo "Found existing cached video: {$block['title']}\n";
                break;
              }
            }
            
            // If no cached file found, fall back to embed
            if (!isset($local_file)) {
              echo "No cached video found for: {$block['title']}, falling back to embed\n";
              $local_file = null; // This will cause frontend to use vimeo_url
            }
          }
        }
      }
    } catch (Exception $e) {
      echo "Error downloading file for block '{$block['title']}': " . $e->getMessage() . "\n";
    }
    
    return $local_file;
  }
  
  private function shuffleChannelsAndBlocks($blocks) {
    // First, group blocks by channel
    $channels = [];
    foreach ($blocks as $block) {
      $channel_title = $block['channel_title'];
      if (!isset($channels[$channel_title])) {
        $channels[$channel_title] = [];
      }
      $channels[$channel_title][] = $block;
    }
    
    // Get array of channel names and shuffle them
    $channel_names = array_keys($channels);
    $seed = crc32($this->getDateSeed());
    mt_srand($seed);
    
    // Shuffle channel order
    for ($i = count($channel_names) - 1; $i > 0; $i--) {
      $j = mt_rand(0, $i);
      $temp = $channel_names[$i];
      $channel_names[$i] = $channel_names[$j];
      $channel_names[$j] = $temp;
    }
    
    // Shuffle blocks within each channel and combine
    $shuffled_blocks = [];
    foreach ($channel_names as $channel_name) {
      $channel_blocks = $channels[$channel_name];
      
      // Shuffle blocks within this channel
      for ($i = count($channel_blocks) - 1; $i > 0; $i--) {
        $j = mt_rand(0, $i);
        $temp = $channel_blocks[$i];
        $channel_blocks[$i] = $channel_blocks[$j];
        $channel_blocks[$j] = $temp;
      }
      
      $shuffled_blocks = array_merge($shuffled_blocks, $channel_blocks);
    }
    
    return $shuffled_blocks;
  }
  
  public function generateSchedule() {
    // Set timezone to match time.php
    date_default_timezone_set('America/New_York');
    
    // Get all blocks
    $blocks = $this->arena->getAllBlocks();
    
    if (empty($blocks)) {
      throw new Exception("No blocks found to create schedule");
    }
    
    // Shuffle channels and their blocks
    $blocks = $this->shuffleChannelsAndBlocks($blocks);
    
    // Generate schedule
    $schedule = [];
    $duration = $this->config['display']['slide_duration'];
    $start_of_day = strtotime('today midnight');  // Changed to explicitly use midnight
    $total_duration = count($blocks) * $duration;
    
    echo "Processing " . count($blocks) . " blocks for schedule generation...\n";
    
    foreach ($blocks as $index => $block) {
      $timestamp = $start_of_day + ($index * $duration);
      
      echo "Processing block " . ($index + 1) . " of " . count($blocks) . ": {$block['title']} ({$block['type']})\n";
      
      // Attempt to download file to cache
      $local_file = $this->attemptDownload($block);
      
      $schedule[] = [
        'timestamp' => $timestamp,
        'time' => date('H:i:s', $timestamp),
        'block' => $block,
        'local_file' => $local_file
      ];
    }
    
    echo "Schedule generation complete!\n";
    
    return [
      'schedule' => $schedule,
      'metadata' => [
        'total_duration' => $total_duration,
        'slide_duration' => $duration,
        'block_count' => count($blocks)
      ]
    ];
  }
  
  public function saveSchedule($schedule) {
    $schedule_file = $this->config['paths']['schedule_file'];
    
    // Create schedule directory if it doesn't exist
    $dir = dirname($schedule_file);
    if (!file_exists($dir)) {
      mkdir($dir, 0755, true);
    }
    
    // Save schedule as JSON
    if (!file_put_contents($schedule_file, json_encode($schedule))) {
      throw new Exception("Failed to write schedule file");
    }
    
    return true;
  }
}

// If this file is called directly, generate and save schedule
if (php_sapi_name() !== 'cli' || isset($argv[0])) {
  try {
    $config = require __DIR__ . '/bootstrap.php';
    $generator = new ScheduleGenerator($config);
    $schedule = $generator->generateSchedule();
    $generator->saveSchedule($schedule);
    
    // Output depends on how we're running this
    if (php_sapi_name() === 'cli') {
      echo "Schedule generated successfully.\n";
      echo "Total blocks: " . count($schedule['schedule']) . "\n";
      echo "First block shows at: " . $schedule['schedule'][0]['time'] . "\n";
      echo "Last block shows at: " . end($schedule['schedule'])['time'] . "\n";
    } else {
      header('Content-Type: application/json');
      echo json_encode(['success' => true, 'schedule' => $schedule]);
    }
  } catch (Exception $e) {
    if (php_sapi_name() === 'cli') {
      echo "Error: " . $e->getMessage() . "\n";
      exit(1);
    } else {
      http_response_code(500);
      echo json_encode(['error' => $e->getMessage()]);
    }
  }
} 