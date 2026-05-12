<?php

return [

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Providers IA — sélection via AI_PROVIDER dans .env
    |--------------------------------------------------------------------------
    |
    | Valeurs possibles : gemini | mistral | groq | claude
    |
    | Recommandation production La Poste :
    |   AI_PROVIDER=mistral → déployé sur OVHcloud France (eu-west/Paris)
    |   Données traitées sur territoire français, hors CLOUD Act américain.
    |   Documentation : https://docs.mistral.ai/api/
    |
    */

    'ai' => [
        'provider' => env('AI_PROVIDER', 'gemini'),
    ],

    'anthropic' => [
        'key'   => env('ANTHROPIC_API_KEY'),
        'model' => env('ANTHROPIC_MODEL', 'claude-sonnet-4-6-20251001'),
    ],

    'groq' => [
        'api_key'  => env('GROQ_API_KEY'),
        'model'    => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
        'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
    ],

    'gemini' => [
        'api_key'  => env('GEMINI_API_KEY'),
        'model'    => env('GEMINI_MODEL', 'gemini-2.0-flash-exp'),
        'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Mistral AI — provider souverain recommandé pour La Poste
    |--------------------------------------------------------------------------
    |
    | API compatible OpenAI. En production :
    |   - Utiliser le endpoint OVHcloud : https://mistral.ai/fr/news/ovhcloud
    |   - Ou l'endpoint Scaleway : https://www.scaleway.com/fr/ia-generative/
    |
    */
    'mistral' => [
        'api_key'  => env('MISTRAL_API_KEY'),
        'model'    => env('MISTRAL_MODEL', 'mistral-large-latest'),
        'base_url' => env('MISTRAL_BASE_URL', 'https://api.mistral.ai/v1'),
    ],

];
