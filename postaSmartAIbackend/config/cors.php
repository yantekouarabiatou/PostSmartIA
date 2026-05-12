<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure CORS settings for your Laravel application.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8001',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        env('FRONTEND_URL'),          // production : https://xxx.vercel.app
    ]),

    // Accepte tous les sous-domaines vercel.app et railway.app (previews/branches)
    'allowed_origins_patterns' => [
        '#^https://[a-z0-9\-]+\.vercel\.app$#',
        '#^https://[a-z0-9\-]+\.railway\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'Content-Length',
        'X-JSON-Response',
    ],

    'max_age' => 86400,

    'supports_credentials' => true,
];
