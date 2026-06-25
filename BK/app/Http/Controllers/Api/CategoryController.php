<?php

namespace App\Http\Controllers\Api;

use App\Models\category;
use Illuminate\Http\Request;

class CategoryController
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return category::with('menuItems')
        ->where('is_active', true)
        ->orderBy('display_order')
        ->get();
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|string',
            'is_active' => 'boolean',
            'display_order' => 'integer'
        ]);

        $category = category::create([
            'name' => $validated['name'],
            'is_active' => $validated['is_active'],
            'display_order' => $validated['display_order']
        ]);

        return response()->json([
            'success' => 1,
            'data' => $category
            ],201);
    }

    /**
     * Display the specified resource.
     */
    public function show(category $category)
    {
        return response()->json(compact('category')) ;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, category $category)
    {
        $validated = $request->validate([
                'name' => 'sometimes|required|min:3|string',
                'is_active' => 'sometimes|boolean',
                'display_order' => 'sometimes|integer|min:1' 
        ]);
        $category->update($validated);
        return response()->json([
            'message' => 'updated successfully',
            'data' => $category
        ]);
       
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(category $category)
    {
        $category->delete();
        return response()->json([
            'message' => 'deleted the category',
        ]);
    }
    
}
