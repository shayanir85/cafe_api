<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
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
            'customer_name' => ['required','string', 'max:255'],
            'customer_phone'=> ['required','string', 'min:11','max:11'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        $order = $this->orderService->create($validated);

        return response()->json([
            'success' => true,
            'data' => $order,
            'message' => 'Order created successfully',
        ], 201);
    }

    public function updateStatus(Request $request, Order $id): JsonResponse
    {

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'ready', 'delivered'])],
        ]);

        $updatedOrder = $this->orderService->updateStatus($id, $validated['status']);

        return response()->json([
            'success' => true,
            'data' => $updatedOrder,
            'message' => 'Order status updated successfully',
        ]);
    }

    public function destroy(Order $order): JsonResponse
    {
        $this->orderService->delete($order);

        return response()->json([
            'success' => true,
            'message' => 'Order deleted successfully',
        ]);
    }
}
