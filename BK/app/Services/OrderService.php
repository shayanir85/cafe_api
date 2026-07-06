<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class OrderService
{
    public function list(array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Order::query()
            ->with(['orderItems.menuItem'])
            ->whereBetween('created_at', [
                Carbon::today(),
                Carbon::tomorrow()
                ])
            ->latest('id');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['table_number'])) {
            $query->where('table_number', $filters['table_number']);
        }

        if (!empty($filters['paginate']) && !empty($filters['per_page'])) {
            return $query->paginate((int) $filters['per_page']);
        }

        return $query->get();
    }

    public function find(int $id): Order
    {
        return Order::with(['orderItems.menuItem.category'])->findOrFail($id);
    }

    public function create(array $data, int $userId): Order
    {
        return DB::transaction(function () use ($data, $userId) {
            $order = Order::create([
                'user_id' => $userId,
                'table_number' => $data['table_number'],
                'status' => 'pending',
                'total_amount' => 0,
                'notes' => $data['notes'] ?? null,
            ]);

            $totalAmount = 0;

            foreach ($data['items'] as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);

                if (!$menuItem->is_available) {
                    throw ValidationException::withMessages([
                        'items' => ["Menu item {$menuItem->id} is not available."],
                    ]);
                }

                $quantity = (int) $item['quantity'];
                $unitPrice = (float) $menuItem->price;
                $lineTotal = $quantity * $unitPrice;

                $order->orderItems()->create([
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $lineTotal,
                ]);

                $totalAmount += $lineTotal;
            }

            $order->update([
                'total_amount' => $totalAmount,
            ]);

            return $order->load(['orderItems.menuItem.category']);
        });
    }

    public function updateStatus(Order $order, string $status): Order
    {
        $order->update([
            'status' => $status,
        ]);

        return $order->load(['orderItems.menuItem.category']);
    }

    public function delete(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->orderItems()->delete();
            $order->delete();
        });
    }
}
