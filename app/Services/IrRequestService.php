<?php

namespace App\Services;

use App\Constants\IrConstants;
use App\Models\IrRequest;
use App\Repositories\IrRequestRepository;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class IrRequestService
{
    public function __construct(
        protected IrRequestRepository $repo,
        protected HrisApiService      $hris,
    ) {}

    public function getFormData(): array
    {
        return [];
    }

    public function getIrList(Request $request, int $empId): array
    {
        $filters = [
            'search'  => trim($request->input('search', '')),
            'status'  => trim($request->input('status', '')),
            'tab'     => in_array($request->input('tab'), ['active', 'history']) ? $request->input('tab') : 'active',
            'start'   => $request->input('start'),
            'end'     => $request->input('end'),
            'perPage' => min(100, max(10, (int) $request->input('perPage', 15))),
            'empId'   => $request->input('empId', ''),
        ];

        // Fetch direct reports from HRIS to determine scope
        $directReports = $this->hris->fetchDirectReports($empId);
        $staffEmpIds   = array_column($directReports, 'emp_id');

        // Build a lookup map: emp_id → { emp_name, department, prodline, station }
        $staffMap = [];
        foreach ($directReports as $dr) {
            $staffMap[(int) $dr['emp_id']] = [
                'emp_name'   => $dr['emp_name']   ?? null,
                'department' => $dr['department']  ?? null,
                'prodline'   => $dr['prodline']    ?? null,
                'station'    => $dr['station']     ?? null,
            ];
        }

        /** @var LengthAwarePaginator $paginator */
        $paginator = $this->repo->listPaginated($empId, $filters, $staffEmpIds);

        $items = collect($paginator->items())->map(function (IrRequest $ir) use ($staffMap) {
            $byRole        = $ir->approvals->keyBy('role');
            $displayStatus = IrConstants::resolveDisplayStatus(
                $ir,
                $byRole->get(IrConstants::ROLE_HR),
                $byRole->get(IrConstants::ROLE_SV),
                $byRole->get(IrConstants::ROLE_DH),
                $ir->daRequest,
                $ir->reasons->isNotEmpty(),
            );

            $codes = $ir->irList->map(fn ($l) => [
                'code_no'   => $l->code_no,
                'violation' => $l->violation,
                'da_type'   => $l->da_type,
                'offense_no'=> $l->offense_no,
            ])->values();

            // Decorate with staff details from HRIS direct-reports lookup
            $staff = $staffMap[(int) $ir->emp_no] ?? null;

            return [
                'id'             => $ir->id,
                'ir_no'          => $ir->ir_no,
                'emp_no'         => $ir->emp_no,
                'emp_name'       => $staff['emp_name']   ?? null,
                'department'     => $staff['department']  ?? null,
                'prodline'       => $staff['prodline']    ?? null,
                'station'        => $staff['station']     ?? null,
                'what'           => $ir->what,
                'date_created'   => $ir->date_created?->format('Y-m-d'),
                'ir_status'      => $ir->ir_status,
                'is_inactive'    => $ir->is_inactive,
                'display_status' => $displayStatus,
                'codes'          => $codes,
            ];
        });

        return [
            'data'          => $items,
            'current_page'  => $paginator->currentPage(),
            'last_page'     => $paginator->lastPage(),
            'total'         => $paginator->total(),
            'from'          => $paginator->firstItem(),
            'to'            => $paginator->lastItem(),
            'per_page'      => $paginator->perPage(),
            'links'         => $paginator->toArray()['links'] ?? [],
            'is_supervisor' => !empty($staffEmpIds),
            'direct_reports'=> array_values(array_map(fn ($dr) => [
                'emp_id'   => (int) $dr['emp_id'],
                'emp_name' => $dr['emp_name'] ?? null,
            ], $directReports)),
        ];
    }

    public function getCodeNumbersPaginated(int $page = 1, int $perPage = 15): array
    {
        return $this->repo->getActiveCodeNumbersPaginated($page, $perPage);
    }

    public function store(array $validated, int $requestorId): IrRequest
    {
        $validated['requestor_id'] = $requestorId;

        return $this->repo->store($validated);
    }

    /**
     * Delegate active-employee lookup entirely to HrisApiService.
     * Returns { data: [], hasMore: bool }
     */
    public function fetchActiveEmployees(string $search = '', int $page = 1, int $perPage = 20): array
    {
        return $this->hris->fetchActiveEmployees($search, $page, $perPage);
    }

    public function fetchWorkDetails(int $employid): ?array
    {
        return $this->hris->fetchWorkDetails($employid);
    }
}
