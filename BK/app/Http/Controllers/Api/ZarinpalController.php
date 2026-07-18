<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ZarinpalController
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    public function requestPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        $order = Order::with('payment')->findOrFail($validated['order_id']);

        if ($order->payment && $order->payment->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'این سفارش قبلاً پرداخت شده است.',
            ], 400);
        }

        $payment = $this->orderService->initiatePayment($order);

        if (!$payment['success']) {
            return response()->json([
                'success' => false,
                'message' => $payment['message'] ?? 'خطا در اتصال به درگاه پرداخت.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'Authority' => $payment['authority'],
            'payment_url' => $payment['payment_url'],
        ]);
    }

    public function verifyPayment(Request $request): RedirectResponse
    {
        $authority = $request->query('Authority');
        $status = $request->query('');

        $frontendUrl = config('app.frontend_url');

        if (!$authority || $status !== 'OK') {
            return redirect($frontendUrl . '?payment=failed&message=پرداخت+لغو+شد');
        }

        $payment = Payment::where('authority', $authority)->first();

        if (!$payment) {
            return redirect($frontendUrl . '?payment=failed&message=شناسه+نامعتبر');
        }

        if ($payment->status === 'paid') {
            return redirect($frontendUrl . '/order/' . $payment->order_id . '?payment=success&ref=' . $payment->reference_id);
        }

        try {
            $response = zarinpal()
                ->merchantId(config('zarinpal.merchant_id'))
                ->amount((int) $payment->amount)
                ->verification()
                ->authority($authority)
                ->send();

            if (!$response->success()) {
                $payment->update(['status' => 'failed']);
                return redirect($frontendUrl . '/order/' . $payment->order_id . '?payment=failed');
            }

            $payment->update([
                'status' => 'paid',
                'reference_id' => $response->referenceId(),
            ]);

            return redirect($frontendUrl . '/order/' . $payment->order_id . '?payment=success&ref=' . $response->referenceId());

        } catch (\Exception $e) {
            $payment->update(['status' => 'failed']);
            return redirect($frontendUrl . '/order/' . $payment->order_id . '?payment=failed');
        }
    }
}
