<?php
header('Content-Type: application/json');
date_default_timezone_set('America/New_York');
echo json_encode(time()); 