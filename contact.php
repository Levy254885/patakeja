<?php
// Receives early-access sign-ups (tenants and landlords/agents) and emails them to Patakeja.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
$TO = 'nziokasila8@gmail.com';

function out($ok, $code = 200) { http_response_code($code); echo json_encode(['ok' => $ok]); exit; }
function clean($v, $max = 500) { $v = str_replace(["\r", "\n"], ' ', trim((string)$v)); return mb_substr(strip_tags($v), 0, $max); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, 405);
$fields = [];
foreach ($_POST as $k => $v) { if (count($fields) >= 20) break; $fields[clean($k, 60)] = clean($v); }
if (empty($fields['Name']) || empty($fields['Main contact'])) out(false, 422);

$type = $fields['type'] ?? 'Sign-up';
$host = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$body = "New Patakeja early-access sign-up ($type)\n\n";
foreach ($fields as $k => $v) { if ($k !== 'type' && $v !== '') $body .= "$k: $v\n"; }
$subject = "Patakeja sign-up: $type - " . $fields['Name'];
$headers = "From: Patakeja <no-reply@$host>\r\nContent-Type: text/plain; charset=UTF-8\r\n";
out(@mail($TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers));
