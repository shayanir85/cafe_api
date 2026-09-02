<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('phone_number', '09113054357')->first();

        $espresso = MenuItem::where('name', 'اسپرسو')->first();
        $latte = MenuItem::where('name', 'لاته')->first();
        $cheesecake = MenuItem::where('name', 'چیزکیک نیویورکی')->first();
        $breakfast = MenuItem::where('name', 'صبحانه کامل')->first();

        if (!$customer || !$espresso || !$latte || !$cheesecake) {
            return;
        }

        $order = Order::updateOrCreate(
            ['id' => 1],
            [
                'user_id' => $customer->id,
                'table_number' => '5',
                'status' => 'pending',
                'total_amount' => ($espresso->price * 2) + $latte->price + $cheesecake->price,
                'is_out' => false,
                'is_cash' => true,
                'notes' => 'کاهش شکر',
            ]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order->id, 'menu_item_id' => $espresso->id],
            ['quantity' => 2, 'unit_price' => $espresso->price, 'subtotal' => $espresso->price * 2]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order->id, 'menu_item_id' => $latte->id],
            ['quantity' => 1, 'unit_price' => $latte->price, 'subtotal' => $latte->price]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order->id, 'menu_item_id' => $cheesecake->id],
            ['quantity' => 1, 'unit_price' => $cheesecake->price, 'subtotal' => $cheesecake->price]
        );

        if ($breakfast) {
            $order2 = Order::updateOrCreate(
                ['id' => 2],
                [
                    'user_id' => $customer->id,
                    'table_number' => '3',
                    'status' => 'ready',
                    'total_amount' => $breakfast->price * 2,
                    'is_out' => false,
                    'is_cash' => false,
                    'notes' => 'بدون قند',
                ]
            );

            OrderItem::updateOrCreate(
                ['order_id' => $order2->id, 'menu_item_id' => $breakfast->id],
                ['quantity' => 2, 'unit_price' => $breakfast->price, 'subtotal' => $breakfast->price * 2]
            );
        }
    }
}
