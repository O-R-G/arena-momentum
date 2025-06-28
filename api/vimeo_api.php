<?php

class VimeoAPI {
  private $client_id;
  private $client_secret;
  private $access_token;
  
  public function __construct($config) {
    $this->client_id = $config['vimeo']['client_id'];
    $this->client_secret = $config['vimeo']['client_secret'];
    $this->access_token = $config['vimeo']['access_token'];
  }
  
  private function makeRequest($endpoint, $method = 'GET', $data = null) {
    $ch = curl_init("https://api.vimeo.com" . $endpoint);
    
    $headers = [
      "Authorization: Bearer " . $this->access_token,
      "Content-Type: application/json"
    ];
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if ($method === 'POST' && $data) {
      curl_setopt($ch, CURLOPT_POST, true);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($status !== 200) {
      throw new Exception("Vimeo API request failed with status $status: $response");
    }
    
    return json_decode($response, true);
  }
  
  public function extractVideoId($url) {
    // Extract video ID from various Vimeo URL formats
    $patterns = [
      '/vimeo\.com\/(\d+)/',
      '/player\.vimeo\.com\/video\/(\d+)/',
      '/vimeo\.com\/groups\/[^\/]+\/videos\/(\d+)/',
      '/vimeo\.com\/channels\/[^\/]+\/(\d+)/'
    ];
    
    foreach ($patterns as $pattern) {
      if (preg_match($pattern, $url, $matches)) {
        return $matches[1];
      }
    }
    
    return null;
  }
  
  public function getVideoInfo($video_id) {
    try {
      $response = $this->makeRequest("/videos/{$video_id}");
      return $response;
    } catch (Exception $e) {
      echo "Error getting video info for ID {$video_id}: " . $e->getMessage() . "\n";
      return null;
    }
  }
  
  public function getDownloadUrl($video_id, $quality = '720p') {
    try {
      $video_info = $this->getVideoInfo($video_id);
      if (!$video_info) {
        return null;
      }
      
      // Look for downloadable files
      if (isset($video_info['download'])) {
        $downloads = $video_info['download'];
        
        // Sort by quality preference
        $quality_order = ['720p', '1080p', '540p', '360p', '480p'];
        
        // First try to find exact quality match
        foreach ($downloads as $download) {
          if (isset($download['quality']) && $download['quality'] === $quality) {
            return $download['link'];
          }
        }
        
        // If exact match not found, try quality order
        foreach ($quality_order as $preferred_quality) {
          foreach ($downloads as $download) {
            if (isset($download['quality']) && $download['quality'] === $preferred_quality) {
              return $download['link'];
            }
          }
        }
        
        // If no quality match, return the first available download
        if (!empty($downloads)) {
          return $downloads[0]['link'];
        }
      }
      
      // If no downloads available, try progressive files
      if (isset($video_info['files'])) {
        $files = $video_info['files'];
        
        // Sort by quality preference
        $quality_order = ['720p', '1080p', '540p', '360p', '480p'];
        
        foreach ($quality_order as $preferred_quality) {
          foreach ($files as $file) {
            if (isset($file['quality']) && $file['quality'] === $preferred_quality && $file['type'] === 'video/mp4') {
              return $file['link'];
            }
          }
        }
        
        // If no quality match, return the first MP4 file
        foreach ($files as $file) {
          if ($file['type'] === 'video/mp4') {
            return $file['link'];
          }
        }
      }
      
      return null;
    } catch (Exception $e) {
      echo "Error getting download URL for video ID {$video_id}: " . $e->getMessage() . "\n";
      return null;
    }
  }
  
  public function downloadVideo($video_id, $filename, $cache_dir) {
    $download_url = $this->getDownloadUrl($video_id);
    if (!$download_url) {
      echo "No download URL available for video ID {$video_id}\n";
      return null;
    }
    
    $filepath = $cache_dir . '/' . $filename;
    
    // Skip if file already exists
    if (file_exists($filepath)) {
      echo "Video already exists: {$filename}\n";
      return $filepath;
    }
    
    echo "Downloading Vimeo video: {$filename}\n";
    
    // Create a cURL handle
    $ch = curl_init($download_url);
    $fp = fopen($filepath, 'wb');
    
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 1800); // 30 minute timeout for large videos
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
      echo "Failed to download video {$filename} (HTTP {$http_code})\n";
      return null;
    }
    
    echo "Successfully downloaded Vimeo video: {$filename}\n";
    return $filepath;
  }
} 