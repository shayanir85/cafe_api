<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;

class OrdersController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $orders = $this->orderService->list([
            'status' => $request->query('status'),
            'table_number' => $request->query('table_number'),
            'paginate' => $request->boolean('paginate'),
            'per_page' => $request->query('per_page', 15),
        ]);

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $order = $this->orderService->find($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_number' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        $order = $this->orderService->create($validated, $request->user()->id);

        try {
            $response = zarinpal()
                ->merchantId(config('zarinpal.merchant_id'))
                ->amount((int) $order->total_amount)
                ->request()
                ->description('پرداخت سفارش شماره ' . $order->id)
                ->callbackUrl(route('payment.verify'))
                ->send();

            if ($response->success()) {
                Payment::create([
                    'order_id' => $order->id,
                    'authority' => $response->authority(),
                    'status' => 'pending',
                    'amount' => $order->total_amount,
                ]);

                return response()->json([
                    'success' => true,
                    'data' => $order,
                    'payment_url' => $response->redirect()->getTargetUrl(),
                    'message' => 'سفارش ایجاد شد. لطفاً پرداخت را انجام دهید.',
                ], 201);
            }

            return response()->json([
                'success' => true,
                'data' => $order,
                'payment_url' => null,
                'message' => 'سفارش ایجاد شد اما ارتباط با درگاه پرداخت برقرار نشد: ' . $response->error()->message(),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => $order,
                'payment_url' => null,
                'message' => 'سفارش ایجاد شد اما درگاه پرداخت در دسترس نیست.',
            ], 201);
        }
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'ready', 'delivered'])],
        ]);

        $updatedOrder = $this->orderService->updateStatus($order, $validated['status']);

        return response()->json([
            'success' => true,
            'data' => $updatedOrder,
            'message' => 'وضعیت سفارش با موفقیت به‌روزرسانی شد.',
        ]);
    }

    public function destroy(Order $order): JsonResponse
    {
        $this->orderService->delete($order);

        return response()->json([
            'success' => true,
            'message' => 'سفارش حذف شد.',
        ]);
    }
}
