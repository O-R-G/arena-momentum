<?php

// Load and validate config
$config = require __DIR__ . '/bootstrap.php';

// Now we can use $config throughout our script
echo "Slide duration is: " . $config['display']['slide_duration'] . " seconds"; 