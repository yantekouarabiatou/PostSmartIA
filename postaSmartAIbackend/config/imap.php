<?php

return [
    'accounts' => [
        'default' => [
            'host'          => env('IMAP_HOST', 'imap.gmail.com'),
            'port'          => (int) env('IMAP_PORT', 993),
            'encryption'    => env('IMAP_ENCRYPTION', 'ssl'),
            'validate_cert' => false,
            'username'      => env('IMAP_USERNAME', ''),
            'password'      => env('IMAP_PASSWORD', ''),
            'protocol'      => 'imap',
            'options'       => [
                'sequence'    => 1, // Webklex\PHPIMAP\IMAP::ST_UID = 1 (package retiré)
                'fetch_flags' => true,
                'open'        => [],
            ],
        ],
    ],
];
