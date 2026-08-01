<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessPaymentRequestJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $orderId
    ) {}

    public function handle(OrderService $orderService): void
    {
        $order = Order::with('payment')->findOrFail($this->orderId);

        if ($order->payment && $order->payment->status === 'paid') {
            return;
        }

        $orderService->initiatePayment($order);
    }
}
