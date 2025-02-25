<?php

// Load configuration
$config = require __DIR__ . '/bootstrap.php';

class ArenaAPI {
  private $access_token;
  private $user_id;
  
  public function __construct($access_token, $user_id) {
    $this->access_token = $access_token;
    $this->user_id = $user_id;
  }
  
  private function makeRequest($endpoint) {
    // Add delay between requests (5 seconds)
    // to not overwhelm the API
    usleep(5000000);  // 5 seconds
    
    $ch = curl_init("https://api.are.na/v2" . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
      "Authorization: Bearer " . $this->access_token,
      "Content-Type: application/json"
    ]);
    
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($status !== 200) {
      if ($status === 429) {  // Too Many Requests
        echo "Rate limit hit, waiting 5 seconds...\n";
        sleep(5);
        return $this->makeRequest($endpoint);  // Retry the request
      }
      throw new Exception("API request failed with status $status: $response");
    }
    
    return json_decode($response, true);
  }
  
  public function getUserChannels() {
    echo "Fetching user channels...\n";
    
    $all_channels = [];
    $page = 1;
    
    do {
      echo "  Fetching page {$page} of channels...\n";
      $response = $this->makeRequest("/users/{$this->user_id}/channels?page={$page}&per=100");
      $all_channels = array_merge($all_channels, $response['channels']);
      $page++;
      
      echo "  Got " . count($response['channels']) . " channels (total: " . count($all_channels) . ")\n";
      
      // Continue if there are more pages (check if we got a full page)
      $has_more = (count($response['channels']) === 100);
    } while ($has_more);
    
    echo "\nInitial channel list:\n";
    foreach ($all_channels as $channel) {
      echo "  - {$channel['title']} (ID: {$channel['id']})\n";
    }
    
    // Filter out duplicate channels by ID
    $unique_channels = [];
    $seen_ids = [];
    
    foreach ($all_channels as $channel) {
      if (!in_array($channel['id'], $seen_ids)) {
        $seen_ids[] = $channel['id'];
        $unique_channels[] = $channel;
      } else {
        echo "  Skipping duplicate channel: {$channel['title']} (ID: {$channel['id']})\n";
      }
    }
    
    echo "\nFound " . count($unique_channels) . " unique channels out of " . count($all_channels) . " total\n";
    return ['channels' => $unique_channels];
  }
  
  public function getChannelBlocks($channel_id) {
    $all_contents = [];
    $page = 1;
    
    // First get channel info to get total length
    echo "Fetching channel {$channel_id} info...\n";
    $channel_info = $this->makeRequest("/channels/{$channel_id}");
    $total_length = $channel_info['length'];
    
    echo "Fetching blocks from channel {$channel_id} (total blocks: {$total_length})...\n";
    
    do {
      echo "  Fetching page {$page}...\n";
      $response = $this->makeRequest("/channels/{$channel_id}/contents?page={$page}&per=100");
      $all_contents = array_merge($all_contents, $response['contents']);
      $page++;
      
      echo "  Got " . count($response['contents']) . " blocks (total: " . count($all_contents) . " of {$total_length})\n";
      
      // Continue if there are more pages
      $has_more = ($total_length > count($all_contents));
    } while ($has_more);
    
    return ['contents' => $all_contents];
  }
  
  public function getAllBlocks() {
    $response = $this->getUserChannels();
    $channels = $response['channels'];
    $all_blocks = [];
    
    foreach ($channels as $index => $channel) {
      echo "\nProcessing channel " . ($index + 1) . " of " . count($channels) . ": " . $channel['title'] . "\n";
      $blocks = $this->getChannelBlocks($channel['id']);
      $media_blocks = array_filter($blocks['contents'], function($block) {
        return $block['class'] === 'Image' || 
               ($block['class'] === 'Media' && $block['source']['url'] && strpos($block['source']['url'], 'vimeo.com') !== false) ||
               ($block['class'] === 'Attachment' && isset($block['attachment']['content_type']) && strpos($block['attachment']['content_type'], 'video/') === 0);
      });
      
      echo "Found " . count($media_blocks) . " media blocks in this channel\n";
      
      foreach ($media_blocks as $block) {
        $block_data = [
          'id' => $block['id'],
          'title' => $block['title'],
          'channel_title' => $channel['title'],
          'channel_id' => $channel['id'],
          'channel_slug' => $channel['slug'],
          'type' => $block['class']
        ];

        if ($block['class'] === 'Image') {
          $block_data['image_url'] = $block['image']['original']['url'];
        } else if ($block['class'] === 'Media') {
          $block_data['embed_html'] = $block['embed']['html'];
          $block_data['source_url'] = $block['source']['url'];
        } else if ($block['class'] === 'Attachment') {
          $block_data['video_url'] = $block['attachment']['url'];
          $block_data['content_type'] = $block['attachment']['content_type'];
        }

        $all_blocks[] = $block_data;
      }
    }
    
    echo "\nTotal media blocks found across all channels: " . count($all_blocks) . "\n";
    return $all_blocks;
  }
}

// If this file is called directly, return JSON response
if (php_sapi_name() !== 'cli') {
  header('Content-Type: application/json');
  try {
    $arena = new ArenaAPI(
      $config['arena']['access_token'],
      $config['arena']['user_id']
    );
    echo json_encode($arena->getAllBlocks());
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
  }
}