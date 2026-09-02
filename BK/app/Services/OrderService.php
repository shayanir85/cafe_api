<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use Hekmatinasser\Verta\Verta;

class OrderService
{
    public function list(array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Order::query()
            ->with(['orderItems.menuItem'])
            ->latest('id');

        if (!empty($filters['date'])) {
            $gregorianDate = Verta::parse($filters['date'])->toCarbon();
            $query->whereDate('created_at', $gregorianDate);
        } else {
            $query->whereBetween('created_at', [
                Carbon::today(),
                Carbon::tomorrow()
            ]);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['table_number'])) {
            $query->where('table_number', $filters['table_number']);
        }

        if (array_key_exists('is_out', $filters) && $filters['is_out'] !== null) {
            $query->where('is_out', filter_var($filters['is_out'], FILTER_VALIDATE_BOOLEAN));
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['min_amount'])) {
            $query->where('total_amount', '>=', (float) $filters['min_amount']);
        }

        if (!empty($filters['max_amount'])) {
            $query->where('total_amount', '<=', (float) $filters['max_amount']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhere('table_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['paginate']) && !empty($filters['per_page'])) {
            $result = $query->paginate((int) $filters['per_page']);
            $result->getCollection()->each->append('jalali_created_at');
            return $result;
        }

        return $query->get()->each->append('jalali_created_at');
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
                'table_number' => $data['table_number'] ?? null,
                'status' => 'pending',
                'total_amount' => 0,
                'notes' => $data['notes'] ?? null,
                'is_out' => $data['is_out'] ?? false,
                'is_cash'=> $data['is_cash'] ?? false,
                'address' => $data['address'] ?? null,
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

    public function initiatePayment(Order $order): array
    {
        try {
            $response = zarinpal()
                ->merchantId(config('zarinpal.merchant_id'))
                ->amount((int) $order->total_amount)
                ->request()
                ->description('پرداخت سفارش شماره ' . $order->id)
                ->callbackUrl(route('payment.verify'))
                ->send();

            if ($response->success()) {
                Payment::updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'authority' => $response->authority(),
                        'status' => 'pending',
                        'amount' => $order->total_amount,
                    ]
                );

                return [
                    'success' => true,
                    'payment_url' => $response->redirect()->getTargetUrl(),
                    'authority' => $response->authority(),
                ];
            }

            return [
                'success' => false,
                'message' => $response->error()->message(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'خطا در اتصال به درگاه پرداخت: ' . $e->getMessage(),
            ];
        }
    }
}
