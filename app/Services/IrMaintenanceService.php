<?php

namespace App\Services;

use App\Models\IrCodeNo;
use App\Repositories\IrMaintenanceRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class IrMaintenanceService
{
    public function __construct(
        protected IrMaintenanceRepository $repo,
        protected HrisApiService          $hris,
    ) {}

    // ── IR Admins ─────────────────────────────────────────────────────────────

    public function getAdminList(): array
    {
        $admins  = $this->repo->listAdmins();
        $empNos  = $admins->pluck('emp_no')->unique()->values()->all();
        $nameMap = $this->resolveNames($empNos);

        return $admins->map(fn ($a) => [
            'id'        => $a->id,
            'emp_no'    => (int) $a->emp_no,
            'emp_name'  => $nameMap[(int) $a->emp_no] ?? null,
            'role'      => $a->role,
            'is_active' => (bool) $a->is_active,
        ])->values()->all();
    }

    public function createAdmin(int $empNo, string $role): void
    {
        if ($this->repo->adminExistsForEmp($empNo)) {
            throw new \InvalidArgumentException('Employee is already registered as an IR admin.');
        }

        $this->repo->createAdmin([
            'emp_no'    => $empNo,
            'role'      => $role,
            'is_active' => true,
        ]);
    }

    public function updateAdmin(int $id, string $role): void
    {
        $admin = $this->repo->findAdmin($id);
        if (!$admin) throw new \InvalidArgumentException('Admin record not found.');
        $this->repo->updateAdmin($id, ['role' => $role]);
    }

    public function toggleAdmin(int $id): void
    {
        $this->repo->toggleAdmin($id);
    }

    public function deleteAdmin(int $id): void
    {
        $this->repo->deleteAdmin($id);
    }

    // ── Code Numbers ──────────────────────────────────────────────────────────

    public function getCodeList(Request $request): array
    {
        $filters = [
            'search'  => trim($request->input('search', '')),
            'status'  => $request->input('status', ''),
            'perPage' => min(100, max(10, (int) $request->input('perPage', 20))),
        ];

        $paginator = $this->repo->listCodesPaginated($filters);

        return [
            'data'         => collect($paginator->items())->map(fn (IrCodeNo $c) => [
                'id'             => $c->id,
                'code_number'    => $c->code_number,
                'violation'      => $c->violation,
                'category'       => $c->category,
                'root_cause'     => $c->root_cause,
                'first_offense'  => $c->first_offense,
                'second_offense' => $c->second_offense,
                'third_offense'  => $c->third_offense,
                'fourth_offense' => $c->fourth_offense,
                'fifth_offense'  => $c->fifth_offense,
                'status'         => (bool) $c->status,
            ])->values()->all(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
            'per_page'     => $paginator->perPage(),
        ];
    }

    public function createCode(array $data): void
    {
        $this->repo->createCode($this->mapCodeFields($data, status: 1));
    }

    public function updateCode(int $id, array $data): void
    {
        $code = $this->repo->findCode($id);
        if (!$code) throw new \InvalidArgumentException('Code number not found.');
        $this->repo->updateCode($id, $this->mapCodeFields($data));
    }

    public function toggleCode(int $id): void
    {
        $this->repo->toggleCode($id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function mapCodeFields(array $data, ?int $status = null): array
    {
        $mapped = [
            'code_number'    => trim($data['code_number']),
            'violation'      => trim($data['violation']),
            'category'       => $data['category']       ? trim($data['category'])       : null,
            'root_cause'     => $data['root_cause']      ? trim($data['root_cause'])     : null,
            'first_offense'  => $data['first_offense']   ? trim($data['first_offense'])  : null,
            'second_offense' => $data['second_offense']  ? trim($data['second_offense']) : null,
            'third_offense'  => $data['third_offense']   ? trim($data['third_offense'])  : null,
            'fourth_offense' => $data['fourth_offense']  ? trim($data['fourth_offense']) : null,
            'fifth_offense'  => $data['fifth_offense']   ? trim($data['fifth_offense'])  : null,
        ];

        if ($status !== null) {
            $mapped['status'] = $status;
        }

        return $mapped;
    }

    private function resolveNames(array $empNos): array
    {
        if (empty($empNos)) return [];

        $baseUrl = rtrim(config('services.hris.url'), '/');
        $key     = config('services.hris.key');

        $responses = Http::pool(fn ($pool) => array_map(
            fn ($no) => $pool->withHeaders(['X-Internal-Key' => $key])
                ->get("{$baseUrl}/api/employees/{$no}"),
            $empNos
        ));

        $nameMap = [];
        foreach ($empNos as $i => $no) {
            $res = $responses[$i] ?? null;
            if ($res && !$res->failed()) {
                $nameMap[(int) $no] = $res->json('data.emp_name');
            }
        }

        return $nameMap;
    }
}
