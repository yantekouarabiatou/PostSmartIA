<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    \Illuminate\Support\Facades\Mail::raw(
        'Test PostSmart IA — La Poste. Si vous recevez ce mail, la configuration fonctionne !',
        function ($m) {
            $m->to('postsmartia@gmail.com')
              ->subject('Test Resend — PostSmart IA');
        }
    );
    echo "✅ Mail envoyé avec succès !\n";
} catch (\Exception $e) {
    echo "❌ Erreur : " . $e->getMessage() . "\n";
}