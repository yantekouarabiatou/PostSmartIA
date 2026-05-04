<?php

namespace App\Policies;

use App\Models\EmailHistory;
use App\Models\User;

class EmailHistoryPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, EmailHistory $emailHistory): bool
    {
        return $user->isAdmin() || $user->id === $emailHistory->user_id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, EmailHistory $emailHistory): bool
    {
        return $user->isAdmin() || $user->id === $emailHistory->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, EmailHistory $emailHistory): bool
    {
        return $user->isAdmin() || $user->id === $emailHistory->user_id;
    }
}
