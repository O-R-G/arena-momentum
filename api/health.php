<?php
require_once 'bootstrap.php';

header('Content-Type: application/json');

$health = [
    'status' => 'healthy',
    'timestamp' => time(),
    'checks' => [
        'config' => [
            'status' => 'healthy',
            'message' => 'Configuration is valid'
        ],
        'arena_api' => [
            'status' => 'healthy',
            'message' => 'Are.na API connection successful'
        ],
        'schedule' => [
            'status' => 'healthy',
            'message' => 'Schedule file exists and is valid'
        ]
    ]
];

// Check if required config values exist
$requiredConfig = [
    'arena.access_token' => 'Are.na access token',
    'arena.user_id' => 'Are.na user ID',
    'paths.schedule_file' => 'Schedule file path'
];

foreach ($requiredConfig as $key => $description) {
    $keys = explode('.', $key);
    $value = $config;
    foreach ($keys as $k) {
        if (!isset($value[$k])) {
            $health['checks']['config'] = [
                'status' => 'unhealthy',
                'message' => "Missing required config: $description"
            ];
            $health['status'] = 'unhealthy';
            echo json_encode($health, JSON_PRETTY_PRINT);
            exit;
        }
        $value = $value[$k];
    }
}

// Check Are.na API connection
try {
    $ch = curl_init("https://api.are.na/v2/users/" . $config['arena']['user_id']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $config['arena']['access_token']
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        $health['checks']['arena_api'] = [
            'status' => 'unhealthy',
            'message' => 'Are.na API returned status code ' . $httpCode
        ];
        $health['status'] = 'unhealthy';
    }
} catch (Exception $e) {
    $health['checks']['arena_api'] = [
        'status' => 'unhealthy',
        'message' => 'Are.na API connection failed: ' . $e->getMessage()
    ];
    $health['status'] = 'unhealthy';
}

// Check schedule file
$scheduleFile = $config['paths']['schedule_file'];
if (!file_exists($scheduleFile)) {
    $health['checks']['schedule'] = [
        'status' => 'unhealthy',
        'message' => 'Schedule file does not exist'
    ];
    $health['status'] = 'unhealthy';
} else {
    $schedule = json_decode(file_get_contents($scheduleFile), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $health['checks']['schedule'] = [
            'status' => 'unhealthy',
            'message' => 'Schedule file is not valid JSON'
        ];
        $health['status'] = 'unhealthy';
    }
}

// Set appropriate HTTP status code
http_response_code($health['status'] === 'healthy' ? 200 : 503);

echo json_encode($health, JSON_PRETTY_PRINT); 