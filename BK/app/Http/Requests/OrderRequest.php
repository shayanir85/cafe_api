<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; 
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'table_number' => [
                $this->input('is_out') ? 'nullable' : 'required',
                 'string'
                 ], 
            'notes' => ['nullable', 'string'],
            'is_out' => ['required', 'boolean'],
            'address' => [
                $this->input('is_out') ? 'required' : 'nullable',
                'string',
                'max:255'
            ],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string'],
            'is_cash' => ['required', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'is_out.required' => 'لطفاً مشخص کنید که سفارش تحویلی است یا حضوری.',
            'address.required' => 'آدرس برای سفارش‌های تحویلی الزامی است.',
            'items.required' => 'سفارش باید حداقل شامل یک آیتم باشد.',
            'items.*.menu_item_id.exists' => 'یک یا چند آیتم منو نامعتبر هستند.',
            'table_number.string' => 'شماره میز باید یک رشته معتبر باشد (مثلاً "A5"، "B12").',
        ];
    }
}