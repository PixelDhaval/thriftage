<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreImportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if(Auth::user() && Auth::user()->hasPermission('imports-create')) {
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
            'container_no' => 'nullable|string|max:255',
            'movement_date' => 'required|date',
            'bl_no' => 'nullable|string|max:255',
            'bl_date' => 'nullable|date',
            'be_no' => 'nullable|string|max:255',
            'be_date' => 'nullable|date',
            'bl_weight' => 'nullable|numeric|min:0',
            'weigh_bridge_weight' => 'nullable|numeric|min:0',
            'type' => 'required|string|in:container,local'
        ];
    }
}
