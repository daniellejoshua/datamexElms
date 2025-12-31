<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\User;

class AnnouncementPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view announcements
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Announcement $announcement): bool
    {
        // Check visibility
        if (in_array($user->role, ['super_admin', 'registrar'])) {
            return true;
        }

        if ($announcement->visibility === 'all_users') {
            return true;
        }

        if ($announcement->visibility === 'teachers_only' && $user->role === 'teacher') {
            return true;
        }

        if ($announcement->visibility === 'students_only' && $user->role === 'student') {
            return true;
        }

        if ($announcement->visibility === 'admins_only' && $user->role === 'super_admin') {
            return true;
        }

        if ($announcement->visibility === 'registrars_only' && $user->role === 'registrar') {
            return true;
        }

        if ($announcement->visibility === 'employees_only' && in_array($user->role, ['teacher', 'registrar'])) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Only head teachers can create announcements
        return $user->role === 'head_teacher';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Announcement $announcement): bool
    {
        // Only head teachers can update announcements
        return $user->role === 'head_teacher';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Announcement $announcement): bool
    {
        // Only head teachers can delete announcements
        return $user->role === 'head_teacher';
    }
}
