<?php

namespace App\Http\Requests;

use App\Models\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreGradedItemsPoolRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if(Auth::user()->hasPermission('graded-items-pools-create')) {
            return true;
        }
        return false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Get the section weight_type to determine validation rules
        if ($this->filled('section_id')) {
            $this->sectionWeightType = Section::find($this->input('section_id'))?->weight_type ?? 'kg';
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'party_id' => 'required|exists:parties,id',
            'import_id' => 'required|exists:imports,id',
            'section_id' => 'required|exists:sections,id',
            'grade_id' => 'required|exists:grades,id',
            'graded_at' => 'nullable|date',
            'weight' => 'required|numeric|min:0.01',
        ];

        // Add pair validation rule if section weight_type is 'pair'
        if ($this->sectionWeightType === 'pair') {
            $rules['pair'] = 'required|integer|min:1';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'pair.required' => 'The pair count is required for this section type.',
            'pair.integer' => 'The pair count must be a whole number.',
            'pair.min' => 'The pair count must be at least 1.',
        ];
    }
}
