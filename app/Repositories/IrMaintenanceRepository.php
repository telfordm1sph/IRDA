<?php

namespace App\Repositories;

use App\Models\IrAdmin;
use App\Models\IrCodeNo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class IrMaintenanceRepository
{
    // ── IR Admins ─────────────────────────────────────────────────────────────

    public function listAdmins(): Collection
    {
        return IrAdmin::orderByRaw("FIELD(role,'hr','hr_mngr')")
            ->orderBy('emp_no')
            ->get();
    }

    public function findAdmin(int $id): ?IrAdmin
    {
        return IrAdmin::find($id);
    }

    public function adminExistsForEmp(int $empNo): bool
    {
        return IrAdmin::where('emp_no', $empNo)->exists();
    }

    public function createAdmin(array $data): IrAdmin
    {
        return IrAdmin::create($data);
    }

    public function updateAdmin(int $id, array $data): void
    {
        IrAdmin::where('id', $id)->update($data);
    }

    public function toggleAdmin(int $id): void
    {
        $admin = IrAdmin::findOrFail($id);
        $admin->update(['is_active' => !$admin->is_active]);
    }

    public function deleteAdmin(int $id): void
    {
        IrAdmin::destroy($id);
    }

    // ── Code Numbers ──────────────────────────────────────────────────────────

    public function listCodesPaginated(array $filters): LengthAwarePaginator
    {
        $query = IrCodeNo::query();

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(fn ($q) => $q
                ->where('code_number', 'like', "%{$s}%")
                ->orWhere('violation', 'like', "%{$s}%")
                ->orWhere('category', 'like', "%{$s}%")
            );
        }

        if ($filters['status'] !== '') {
            $query->where('status', (bool)(int) $filters['status']);
        }

        return $query->orderBy('code_number')
            ->paginate((int) ($filters['perPage'] ?? 20))
            ->withQueryString();
    }

    public function findCode(int $id): ?IrCodeNo
    {
        return IrCodeNo::find($id);
    }

    public function createCode(array $data): IrCodeNo
    {
        return IrCodeNo::create($data);
    }

    public function updateCode(int $id, array $data): void
    {
        IrCodeNo::where('id', $id)->update($data);
    }

    public function toggleCode(int $id): void
    {
        $code = IrCodeNo::findOrFail($id);
        $code->update(['status' => !$code->status]);
    }
}
