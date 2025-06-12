<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreGradedBagsPoolRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if(Auth::user()->hasPermission('graded-bags-pools-create')) {
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
            'weight_id' => 'required|exists:weights,id',
            'item_id' => 'required|exists:items,id',
            'grade_id' => 'required|exists:grades,id'
            'quantity' => 'required|integer|min:1',
        ];
    }
}
