<?php

namespace App\Http\Controllers\Api;

use App\Models\MenuItem;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MenuItemsController extends Controller
{
    public function __construct(
        protected MenuService $menuService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $menuItems = $this->menuService->list([
            'category_id' => $request->query('category_id'),
            'is_available' => $request->query('is_available'),
            'search' => $request->query('search'),
            'paginate' => $request->boolean('paginate'),
            'per_page' => $request->query('per_page', 15),
        ]);

        return response()->json([
            'success' => true,
            'data' => $menuItems,
        ]);
    }
    public function list(): JsonResponse
    {
        $menuItems = MenuItem::where('is_available', 1)->get();

        return response()->json([
            'success' => true,
            'data' => $menuItems,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $menuItem = $this->menuService->find($id);

        return response()->json([
            'success' => true,
            'data' => $menuItem,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'is_available' => ['nullable', 'boolean'],
        ]);

        $menuItem = $this->menuService->create($validated);

        return response()->json([
            'success' => true,
            'data' => $menuItem,
            'message' => 'Menu item created successfully',
        ], 201);
    }

    public function toggle_is_available($id): JsonResponse
    {
        $result = MenuItem::findOrFail($id);
        $result->is_available = !$result->is_available;
        $result->save();

        return response()->json([
            'success' => true,
            'data'=> $result,
            'message' => 'Menu item updated successfully',
        ]);
    }
    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'is_available' => ['sometimes', 'boolean'],
        ]);

        $updatedMenuItem = $this->menuService->update($menuItem, $validated);

        return response()->json([
            'success' => true,
            'data' => $updatedMenuItem,
            'message' => 'Menu item updated successfully',
        ]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $this->menuService->delete($menuItem);

        return response()->json([
            'success' => true,
            'message' => 'Menu item deleted successfully',
        ]);
    }
}
