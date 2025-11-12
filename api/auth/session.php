<?php
require_once '../helpers.php';

$user = getAuthenticatedUser();

if ($user) {
    jsonSuccess(['user' => $user]);
} else {
    jsonError('Not authenticated', 401);
}

