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
        $customer = User::where('email', 'customer@cafe.com')->first();

        $espresso = MenuItem::where('name', 'اسپرسو')->first();
        $latte = MenuItem::where('name', 'لاته')->first();
        $cheesecake = MenuItem::where('name', 'چیزکیک نیویورکی')->first();

        if (!$customer || !$espresso || !$latte || !$cheesecake) {
            return;
        }

        $order = Order::create([
            'table_number' => '5',
            'customer_name' => 'علی احمدی',
            'customer_phone' => '09113054357',
            'notes' => 'بدون پیاز',
            'status' => 'pending',
            'total_amount' => ($espresso->price * 2) + $latte->price + $cheesecake->price,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $espresso->id,
            'quantity' => 2,
            'unit_price' => $espresso->price,
            'subtotal' => $espresso->price * 2,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $latte->id,
            'quantity' => 1,
            'unit_price' => $latte->price,
            'subtotal' => $latte->price,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $cheesecake->id,
            'quantity' => 1,
            'unit_price' => $cheesecake->price,
            'subtotal' => $cheesecake->price,
        ]);
    }
}
