<?php

require __DIR__ . '/fetch_arena.php';

$arena = new ArenaAPI(
  $config['arena']['access_token'],
  $config['arena']['user_id']
);

// If channel ID is provided as argument, test single channel
if (isset($argv[1])) {
  $channel_id = $argv[1];
  echo "Fetching blocks from channel {$channel_id}...\n";
  $blocks = $arena->getChannelBlocks($channel_id);
  echo "Found " . count($blocks['contents']) . " blocks\n";
  print_r($blocks);
} else {
  // Otherwise fetch all blocks
  echo "Fetching all blocks...\n";
  print_r($arena->getAllBlocks());
} 