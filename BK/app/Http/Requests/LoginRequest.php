<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required_without:phone_number|email',
            'phone_number' => 'required_without:email|max:11',
            'password' => 'required|string|min:8',
        ];
    }

    public function messages(): array
    {
        return [
            'email.required_without' => 'ایمیل یا شماره موبایل الزامی است',
            'email.email' => 'فرمت ایمیل صحیح نیست',
            'phone_number.required_without' => 'ایمیل یا شماره موبایل الزامی است',
            'phone_number.max' => 'شماره موبایل نباید بیشتر از ۱۱ کاراکتر باشد',
            'password.required' => 'رمز عبور الزامی است',
            'password.min' => 'رمز عبور باید حداقل ۸ کاراکتر باشد',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'errors' => 'خطا در اعتبارسنجی',
                'message' => $validator->errors()
            ], 422)
        );
    }
}
