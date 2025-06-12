<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

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
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'party_id' => 'required|exists:parties,id',
            'import_id' => 'required|exists:imports,id',
            'item_id' => 'required|exists:items,id',
            'grade_id' => 'required|exists:grades,id',
            'graded_at' => 'nullable|date',
            'weight' => 'required|numeric|min:0',
        ];
    }
}
