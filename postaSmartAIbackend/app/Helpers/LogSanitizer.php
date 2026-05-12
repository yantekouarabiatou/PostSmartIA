<?php

namespace App\Helpers;

/**
 * Masque les champs sensibles avant écriture dans les logs
 * pour garantir la conformité RGPD / CNIL.
 */
class LogSanitizer
{
    private static array $sensitiveKeys = [
        'body', 'body_text', 'body_html', 'content', 'email_content',
        'raw_response', 'text', 'message', 'reply',
        'client_name', 'from_name', 'from_email', 'email',
        'password', 'token', 'api_key', 'key', 'secret',
        'phone', 'client_phone', 'call_summary',
    ];

    /**
     * Tronque ou masque les valeurs sensibles dans un tableau de contexte de log.
     */
    public static function sanitize(array $data): array
    {
        foreach ($data as $key => $value) {
            if (in_array(strtolower((string) $key), self::$sensitiveKeys, true)) {
                if (is_string($value) && strlen($value) > 0) {
                    $preview = mb_substr($value, 0, 30);
                    $data[$key] = $preview . '…[REDACTED ' . strlen($value) . ' chars]';
                } elseif ($value !== null) {
                    $data[$key] = '[REDACTED]';
                }
            } elseif (is_array($value)) {
                $data[$key] = self::sanitize($value);
            }
        }

        return $data;
    }

    /**
     * Version fluide : wraps Log::error avec sanitization automatique.
     */
    public static function error(string $message, array $context = []): void
    {
        \Illuminate\Support\Facades\Log::error($message, self::sanitize($context));
    }

    public static function warning(string $message, array $context = []): void
    {
        \Illuminate\Support\Facades\Log::warning($message, self::sanitize($context));
    }

    public static function info(string $message, array $context = []): void
    {
        \Illuminate\Support\Facades\Log::info($message, self::sanitize($context));
    }
}
