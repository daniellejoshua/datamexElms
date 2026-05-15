<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasRole('head_teacher');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $program = \App\Models\Program::find($this->program_id);
        $maxYearLevel = $program && $program->education_level === 'senior_high' ? 12 : 4;

        return [
            'program_id' => ['required', 'exists:programs,id'],
            'curriculum_id' => ['nullable', 'exists:curriculum,id'],
            'section_name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sections')->where(function ($query) {
                    return $query->where('program_id', $this->program_id)
                        ->where('year_level', $this->year_level)
                        ->where('academic_year', $this->academic_year)
                        ->where('semester', $this->semester);
                }),
            ],
            'academic_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', Rule::in(['1st', '2nd'])],
            'year_level' => ['required', 'integer', 'min:1', 'max:'.$maxYearLevel],
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
            'curriculum_id.exists' => 'The selected curriculum is invalid.',
            'section_name.required' => 'Section name is required.',
            'section_name.unique' => 'A section with this name already exists for the selected program and year level.',
            'academic_year.required' => 'Academic year is required.',
            'semester.required' => 'Semester is required.',
            'year_level.required' => 'Year level is required.',
        ];
    }
}
