<?php

namespace App\Http\Controllers\Api;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController
{
    public function index()
    {
        $categories = Category::with('menuItems')
            ->where('is_active', true)
            ->orderBy('display_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|string',
            'is_active' => 'boolean',
            'display_order' => 'integer'
        ]);

        $category = Category::create([
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'data' => $category
        ], 201);
    }

    public function show(Category $category)
    {
        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|min:3|string',
            'is_active' => 'sometimes|boolean',
            'display_order' => 'sometimes|integer|min:1'
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'updated successfully',
        ]);
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'deleted the category',
        ]);
    }
}
