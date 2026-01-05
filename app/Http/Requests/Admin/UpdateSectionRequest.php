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
            'program_id' => ['sometimes', 'exists:programs,id'],
            'curriculum_id' => ['sometimes', 'exists:curriculum,id'],
            'section_name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sections')->where(function ($query) {
                    return $query->where('program_id', $this->program_id ?? $this->route('section')->program_id)
                        ->where('year_level', $this->year_level ?? $this->route('section')->year_level);
                })->ignore($this->route('section')->id),
            ],
            'academic_year' => ['sometimes', 'string', 'max:20'],
            'semester' => ['sometimes', Rule::in(['1st', '2nd'])],
            'year_level' => ['sometimes', 'integer', 'min:1', 'max:4'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'program_id.required' => 'Please select a program.',
            'program_id.exists' => 'The selected program is invalid.',
            'curriculum_id.required' => 'Please select a curriculum.',
            'curriculum_id.exists' => 'The selected curriculum is invalid.',
            'section_name.required' => 'Section name is required.',
            'section_name.unique' => 'A section with this name already exists for the selected program and year level.',
            'academic_year.required' => 'Academic year is required.',
            'semester.required' => 'Semester is required.',
            'year_level.required' => 'Year level is required.',
        ];
    }
}
