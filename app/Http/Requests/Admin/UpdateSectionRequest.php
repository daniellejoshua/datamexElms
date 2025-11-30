<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasRole('head_teacher') || $this->user()->hasRole('super_admin');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'course_id' => ['required', 'exists:courses,id'],
            'section_name' => ['required', 'string', 'max:50'],
            'academic_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', Rule::in(['first', 'second', 'summer'])],
            'room' => ['nullable', 'string', 'max:50'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'course_id.required' => 'Please select a course.',
            'course_id.exists' => 'The selected course is invalid.',
            'section_name.required' => 'Section name is required.',
            'academic_year.required' => 'Academic year is required.',
            'semester.required' => 'Semester is required.',
        ];
    }
}
