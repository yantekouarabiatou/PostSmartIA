<?php

namespace App\Observers;

use App\Models\User;
use App\Services\ActivityLogService;

class UserObserver
{
    public function created(User $user): void
    {
        ActivityLogService::log('create', "Création de l'utilisateur: {$user->full_name} ({$user->email})", User::class, $user->id);
    }

    public function updated(User $user): void
    {
        ActivityLogService::log('update', "Modification de l'utilisateur: {$user->full_name} ({$user->email})", User::class, $user->id);
    }

    public function deleted(User $user): void
    {
        ActivityLogService::log('delete', "Suppression de l'utilisateur: {$user->full_name} ({$user->email})", User::class, $user->id);
    }
}
