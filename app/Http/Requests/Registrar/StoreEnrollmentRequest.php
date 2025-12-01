<?php

namespace App\Http\Requests\Registrar;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEnrollmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole(['admin', 'registrar']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'birth_date' => 'required|date|before:today',
            'address' => 'required|string|max:500',
            'phone' => 'nullable|string|max:20',
            'parent_contact' => 'nullable|string|max:20',
            'program_id' => 'required|exists:programs,id',
            'academic_year' => 'required|string|max:20',
            'semester' => 'required|string|in:1,2',
            'year_level' => 'required|integer|min:1|max:4',
            'student_number' => 'nullable|string|unique:students,student_number',
            'temporary_password' => 'nullable|string|min:8',
        ];
    }

    /**
     * Get custom validation error messages.
     */
    public function messages(): array
    {
        return [
            'birth_date.before' => 'Birth date must be before today.',
            'program_id.exists' => 'Selected program is invalid.',
            'semester.in' => 'Semester must be either 1 or 2.',
            'student_number.unique' => 'Student number already exists.',
        ];
    }
}
