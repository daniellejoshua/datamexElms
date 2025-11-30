<?php

namespace App\Traits;

use App\Models\GradeVersion;
use App\Models\SemesterFinalization;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

trait HasVersions
{
    public static function bootHasVersions(): void
    {
        static::updating(function ($model) {
            // Only create versions if grades are not finalized and there are actual grade changes
            if ($model->canCreateVersion() && $model->hasGradeChanges()) {
                $model->createGradeVersion();
            }
        });
    }
    
    public function versions(): HasMany
    {
        return $this->hasMany(GradeVersion::class, $this->getGradeVersionColumn())
            ->orderBy('version_number', 'desc');
    }
    
    protected function createGradeVersion(): void
    {
        $user = Auth::user();
        
        if (!$user || !$user->isTeacher()) {
            return; // Only teachers can create grade versions
        }

        $latestVersion = $this->getLatestVersionNumber();
        
        $versionData = [
            $this->getGradeVersionColumn() => $this->id,
            'version_number' => $latestVersion + 1,
            'grade_type' => $this->getGradeType(),
            'teacher_id' => $user->teacher->id,
            'teacher_name' => $user->name,
            'change_reason' => $this->change_reason ?? 'Grade update',
            'teacher_remarks' => $this->teacher_remarks ?? null,
            'change_type' => $this->change_type ?? 'correction',
            'requires_approval' => $this->requiresApproval(),
            'is_approved' => !$this->requiresApproval(),
            'academic_year' => $this->academic_year ?? '2024-2025',
            'semester' => $this->semester ?? '1st',
            'is_pre_finalization' => true,
            ...$this->getGradeVersionData(),
        ];
        
        GradeVersion::create($versionData);
    }
    
    protected function getLatestVersionNumber(): int
    {
        return GradeVersion::where($this->getGradeVersionColumn(), $this->id)
                          ->max('version_number') ?? 0;
    }
    
    protected function hasGradeChanges(): bool
    {
        $gradeFields = $this->getGradeType() === 'shs' 
            ? ['first_quarter_grade', 'second_quarter_grade', 'third_quarter_grade', 'fourth_quarter_grade', 'final_grade']
            : ['prelim_grade', 'midterm_grade', 'prefinals_grade', 'finals_grade', 'semester_grade'];
            
        return $this->isDirty($gradeFields);
    }
    
    public function canCreateVersion(): bool
    {
        return !$this->isGradeFinalized();
    }
    
    public function isGradeFinalized(): bool
    {
        // Check if the grade itself is finalized
        if (isset($this->attributes['status']) && $this->attributes['status'] === 'finalized') {
            return true;
        }
        
        // Check if the semester is finalized system-wide
        $currentYear = '2024-2025'; // This should come from academic calendar config
        $currentSemester = '1st'; // This should come from academic calendar config
        
        return SemesterFinalization::isFinalized(
            $currentYear,
            $currentSemester,
            $this->getGradeType(),
            $this->getTrack()
        );
    }
    
    public function finalizeGrade(?string $notes = null): bool
    {
        if ($this->status === 'finalized') {
            return false;
        }
        
        $this->update([
            'status' => 'finalized',
            'finalized_at' => now(),
            'finalized_by' => Auth::id(),
            'finalization_notes' => $notes
        ]);
        
        // Mark all existing versions as post-finalization
        GradeVersion::where($this->getGradeVersionColumn(), $this->id)
            ->update(['is_pre_finalization' => false]);
        
        return true;
    }
    
    public function canModifyGrades(): bool
    {
        return !$this->isGradeFinalized();
    }
    
    protected function getTrack(): ?string
    {
        return null; // Override in models that need track information
    }
    
    // Abstract methods that must be implemented by the using model
    abstract protected function getGradeVersionColumn(): string;
    abstract protected function getGradeType(): string;
    abstract protected function getGradeVersionData(): array;
    abstract protected function requiresApproval(): bool;
}
