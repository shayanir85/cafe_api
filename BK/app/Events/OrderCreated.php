<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public bool $deleteWhenMissingModels = true;

    public $afterCommit = true;

    public function __construct(
        public Order $order,
        public array $payment
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.orders'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'order' => $this->order->load(['orderItems.menuItem.category']),
            'payment' => $this->payment,
        ];
    }
}
