<?php

namespace App\Http\Controllers\Api;

use App\Events\OrderStatusUpdated;
use App\Jobs\ProcessOrderJob;
use App\Models\Order;
use App\Services\OrderService;
use App\Http\Requests\OrderRequest; 
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
    $filters = array_filter([
        'status'       => $request->query('status'),
        'table_number' => $request->query('table_number'),
        'date'         => $request->query('date'),
        'is_out'       => $request->has('is_out') ? $request->boolean('is_out') : null,
        'user_id'      => $request->query('user_id'),
        'min_amount'   => $request->query('min_amount'),
        'max_amount'   => $request->query('max_amount'),
        'search'       => $request->query('search'),
    ], function ($value) {
        return !is_null($value) && $value !== '';
    });

    // Put pagination controls where the service expects them
    $filters['paginate'] = $request->boolean('paginate', true);
    $filters['per_page'] = $request->query('per_page', 20);

    $orders = $this->orderService->list($filters);

    $meta = [
        'filters'  => $filters,
        'per_page' => $filters['per_page'],
    ];

    // Only include 'total' if the result is a paginator
    if ($orders instanceof \Illuminate\Pagination\LengthAwarePaginator) {
        $meta['total'] = $orders->total();
    }

    return response()->json([
        'success' => true,
        'data'    => $orders,
        'meta'    => $meta,
    ]);
}

    public function show(Order $order): JsonResponse
    {
        $order->load(['orderItems.menuItem.category']);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function store(OrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

        ProcessOrderJob::dispatch($validated, $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'سفارش در حال پردازش است.',
        ], 202);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'ready', 'delivered'])],
        ]);

        $updatedOrder = $this->orderService->updateStatus($order, $validated['status']);

        broadcast(new OrderStatusUpdated($updatedOrder));

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
