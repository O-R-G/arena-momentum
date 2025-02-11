<?php

require __DIR__ . '/fetch_arena.php';

class ScheduleGenerator {
  private $arena;
  private $config;
  
  public function __construct($config) {
    $this->config = $config;
    $this->arena = new ArenaAPI(
      $config['arena']['access_token'],
      $config['arena']['user_id']
    );
  }
  
  private function getDateSeed() {
    // Use current date as seed for consistent shuffling
    return date('Y-m-d');
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
    
    foreach ($blocks as $index => $block) {
      $timestamp = $start_of_day + ($index * $duration);
      $schedule[] = [
        'timestamp' => $timestamp,
        'time' => date('H:i:s', $timestamp),
        'block' => $block
      ];
    }
    
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