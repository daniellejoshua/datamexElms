<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
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
            'course_code' => ['required', 'string', 'max:20', 'unique:courses,course_code'],
            'course_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'credits' => ['required', 'integer', 'min:1', 'max:10'],
            'education_level' => ['required', Rule::in(['college', 'shs'])],
            'year_level' => ['nullable', 'string', 'max:20'],
            'semester' => ['nullable', Rule::in(['1st', '2nd', 'summer'])],
            'prerequisites' => ['nullable', 'string', 'max:500'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'course_code.unique' => 'This course code is already in use.',
            'credits.min' => 'Credits must be at least 1.',
            'credits.max' => 'Credits cannot exceed 10.',
        ];
    }
}
