<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public bool $deleteWhenMissingModels = true;

    public $afterCommit = true;

    public function __construct(
        public Order $order
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('admin.orders'),
        ];

        if (!empty($this->order->user_id)) {
            $channels[] = new PrivateChannel('user.orders.' . $this->order->user_id);
        }

        return $channels;
    }

    public function broadcastWith(): array
    {
        return [
            'order' => $this->order->load(['orderItems.menuItem.category']),
        ];
    }
}
