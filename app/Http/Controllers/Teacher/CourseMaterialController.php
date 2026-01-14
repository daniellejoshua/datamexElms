<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\CourseMaterial;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CourseMaterialController extends Controller
{
    public function index(SectionSubject $sectionSubject): Response
    {
        // Verify teacher is assigned to this section subject
        $teacher = Auth::user()->teacher;
        if ($sectionSubject->teacher_id !== $teacher->id) {
            abort(403, 'You do not have access to this section subject.');
        }

        $materials = CourseMaterial::with(['teacher.user'])
            ->where('section_subject_id', $sectionSubject->id)
            ->where('teacher_id', $teacher->id)
            ->active()
            ->orderBy('upload_date', 'desc')
            ->get();

        return Inertia::render('Teacher/Materials/Index', [
            'section' => $sectionSubject->section->load(['program', 'sectionSubjects.subject']),
            'materials' => $materials,
            'sectionSubject' => $sectionSubject->load(['subject']),
        ]);
    }

    public function store(Request $request, SectionSubject $sectionSubject)
    {
        $teacher = Auth::user()->teacher;

        // Verify teacher is assigned to this section subject
        if ($sectionSubject->teacher_id !== $teacher->id) {
            abort(403, 'You do not have access to this section subject.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt,jpg,jpeg,png|max:10240', // 10MB max
            'category' => 'required|in:lecture,assignment,reading,exam,other',
            'visibility' => 'required|in:all_students,specific_students',
        ]);

        $file = $request->file('file');
        $fileHash = hash_file('sha256', $file->getRealPath());

        // Check if this exact file already exists
        $existingFile = CourseMaterial::findByFileHash($fileHash);

        if ($existingFile) {
            // File already exists, create a reference instead of uploading again
            $material = CourseMaterial::createReference($existingFile, [
                'section_id' => $sectionSubject->section_id,
                'section_subject_id' => $sectionSubject->id,
                'teacher_id' => $teacher->id,
                'title' => $request->title,
                'description' => $request->description,
                'original_name' => $file->getClientOriginalName(),
                'category' => $request->category,
                'visibility' => $request->visibility,
                'is_active' => true,
                'upload_date' => now()->toDateString(),
                'download_count' => 0,
                'version_number' => 1,
            ]);

            return response()->json(['message' => 'Learning material added successfully! (File was already in system, so we reused it to save storage space.)']);
        }

        // File is new, upload it
        $fileName = time().'_'.$file->getClientOriginalName();
        $filePath = $file->storeAs('course_materials/'.$sectionSubject->section_id, $fileName, config('filesystems.default'));

        CourseMaterial::create([
            'section_id' => $sectionSubject->section_id,
            'section_subject_id' => $sectionSubject->id,
            'teacher_id' => $teacher->id,
            'title' => $request->title,
            'description' => $request->description,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_hash' => $fileHash,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'original_name' => $file->getClientOriginalName(),
            'category' => $request->category,
            'visibility' => $request->visibility,
            'upload_date' => now()->toDateString(),
        ]);

        return response()->json(['message' => 'Learning material uploaded successfully!']);
    }

    public function destroy(SectionSubject $sectionSubject, CourseMaterial $material)
    {
        $teacher = Auth::user()->teacher;

        // Verify teacher is assigned to this section subject
        if ($sectionSubject->teacher_id !== $teacher->id) {
            abort(403, 'You do not have access to this section subject.');
        }

        // Verify teacher owns this material
        if ($material->teacher_id !== $teacher->id) {
            abort(403, 'You do not have access to this material.');
        }

        // Delete the file
        if (Storage::disk('public')->exists($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return response()->json(['message' => 'Learning material deleted successfully!']);
    }

    public function download(SectionSubject $sectionSubject, CourseMaterial $material)
    {
        $teacher = Auth::user()->teacher;

        // Verify teacher is assigned to this section subject
        if ($sectionSubject->teacher_id !== $teacher->id) {
            abort(403, 'You do not have access to this section subject.');
        }

        // Verify teacher has access
        if ($material->teacher_id !== $teacher->id) {
            abort(403, 'You do not have access to this material.');
        }

        if (! Storage::disk(config('filesystems.default'))->exists($material->file_path)) {
            abort(404, 'File not found.');
        }

        // Increment download count
        $material->increment('download_count');

        return Storage::disk(config('filesystems.default'))->download($material->file_path, $material->original_name);
    }
}
