<?php

namespace App\Services;

use App\Models\MenuItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;

class MenuService
{
    public function list(array $filters = []): Collection|LengthAwarePaginator
    {
        $query = MenuItem::query()
            ->with('category')
            ->latest('id');

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (array_key_exists('is_available', $filters) && $filters['is_available'] !== null) {
            $query->where('is_available', filter_var($filters['is_available'], FILTER_VALIDATE_BOOLEAN));
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['paginate']) && !empty($filters['per_page'])) {
            return $query->paginate((int) $filters['per_page']);
        }

        return $query->get();
    }

    public function find(int $id): MenuItem
    {
        return MenuItem::with('category')->findOrFail($id);
    }

    public function create(array $data): MenuItem
    {
        $image = $data['image'] ?? null;
        unset($data['image']);

        $menuItem = MenuItem::create($data);

        if ($image instanceof UploadedFile) {
            $relativePath = $this->storeImage($image, $menuItem->id);
            $menuItem->update(['image_url' => $relativePath]);

        }

        return $menuItem->fresh()->load('category');
    }

    public function update(MenuItem $menuItem, array $data): MenuItem
    {
        if (isset($data['image']) && $data['image'] instanceof UploadedFile) {

            if ($menuItem->image_url) {
                $oldPath = public_path($menuItem->image_url);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            $data['image_url'] = $this->storeImage($data['image'], $menuItem->id);
            }
            
        unset($data['image']);
        $menuItem->update($data);

        return $menuItem->fresh()->load('category');
    }

    public function delete(MenuItem $menuItem): void
    {
        if ($menuItem->image_url) {
            $oldPath = public_path($menuItem->image_url);
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        $menuItem->delete();
    }

    protected function storeImage(UploadedFile $file, int $menuItemId): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $fileName = "avatar_{$menuItemId}.{$extension}";
        $directory = public_path('images/menu-items');

        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
            $oldFile = $directory . "/avatar_{$menuItemId}.{$ext}";
            if (file_exists($oldFile)) {
                unlink($oldFile);
            }
        }

        $file->move($directory, $fileName);

        return "images/menu-items/{$fileName}";
    }
}
