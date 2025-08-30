<?php
// Set timezone to your zone, so it works with your time for others or use Universal time zone (UTC)--- this time zone will makemenu expire same time for all users across the world
date_default_timezone_set("UTC");

// Get POST values
$username = trim($_POST['user'] ?? '');
$password = trim($_POST['pass'] ?? '');

// Basic validation
if (empty($username) || empty($password)) {
    echo "missing_fields";
    exit;
}

// Hardcoded accounts with expiration
$accounts = [
    "RetiredGamer" => ["password" => "Gamer123", "expires" => "2025-12-31 23:59:59"],
    "FreeUser"     => ["password" => "FreeKey",   "expires" => "2024-12-31 00:00:00"],
    "BetaTest"     => ["password" => "TryMe",     "expires" => "2025-07-15 12:00:00"]
];

if (isset($accounts[$username])) {
    $userData = $accounts[$username];
    $correctPass = $userData["password"];
    $expiresStr = $userData["expires"];
    $expires = strtotime($expiresStr);
    $now = time();

    if (strcasecmp($password, $correctPass) !== 0) {
        echo "wrong_pass";
    } else if ($now > $expires) {
        echo "expired";
    } else {
        // Return status, expiration time, and server time (all in UTC)
        echo "valid|$expiresStr|server=" . date("Y-m-d H:i:s");
    }
} else {
    echo "not_found";
}
?>
