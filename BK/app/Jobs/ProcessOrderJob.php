<?php

namespace App\Jobs;

use App\Events\OrderCreated;
use App\Services\OrderService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessOrderJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public array $validatedData,
        public int $userId
    ) {}

    public function handle(OrderService $orderService): void
    {
        try{
            $order = $orderService->create($this->validatedData, $this->userId);
        
            if($this->validatedData['is_cash']){
                $payment = 'نقدی';
            }else{    
                $payment = $orderService->initiatePayment($order);
            }   
            broadcast(new OrderCreated($order, $payment));
        }catch(\Throwable $e){
            Log::error($e);
        }
    }
}
