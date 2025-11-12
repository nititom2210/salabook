<?php
require_once '../helpers.php';

session_start();
session_destroy();

jsonSuccess(null, 'Logout successful');

