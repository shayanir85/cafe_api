<?php

namespace App\Jobs;

use App\Events\OrderCreated;
use App\Services\OrderService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessOrderJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public array $validatedData,
        public int $userId
    ) {}

    public function handle(OrderService $orderService): void
    {
        $order = $orderService->create($this->validatedData, $this->userId);

        $payment = $orderService->initiatePayment($order);

        broadcast(new OrderCreated($order, $payment));
    }
}
