<?php

namespace App\Services;

use App\Constants\IrConstants;
use App\Models\IrAdmin;
use App\Models\IrRequest;
use App\Repositories\IrRequestRepository;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Http;

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

    /**
     * "My IR" inbox — always scoped to the logged-in employee's own records.
     * No HRIS direct-reports call needed.
     */
    public function getMyIrList(Request $request, int $empId): array
    {
        $filters = $this->buildFilters($request);

        /** @var LengthAwarePaginator $paginator */
        $paginator = $this->repo->listPaginated($empId, $filters, []);

        $items = collect($paginator->items())->map(fn(IrRequest $ir) => $this->mapIrRow($ir));

        return $this->paginatedResponse($paginator, $items);
    }

    /**
     * "Staff IR" — scoped to the logged-in supervisor's direct reports via HRIS.
     * Returns direct_reports list for the employee filter dropdown.
     */
    public function getStaffIrList(Request $request, int $empId): array
    {
        $filters = $this->buildFilters($request);

        $directReports = $this->hris->fetchDirectReports($empId);
        $staffEmpIds   = array_column($directReports, 'emp_id');

        $staffMap = [];
        foreach ($directReports as $dr) {
            $staffMap[(int) $dr['emp_id']] = [
                'emp_name'   => $dr['emp_name']  ?? null,
                'department' => $dr['department'] ?? null,
                'prodline'   => $dr['prodline']   ?? null,
                'station'    => $dr['station']    ?? null,
            ];
        }

        /** @var LengthAwarePaginator $paginator */
        $paginator = $this->repo->listPaginated($empId, $filters, $staffEmpIds);

        $items = collect($paginator->items())->map(
            fn(IrRequest $ir) => $this->mapIrRow($ir, $staffMap)
        );

        return array_merge($this->paginatedResponse($paginator, $items), [
            'direct_reports' => array_values(array_map(fn($dr) => [
                'emp_id'   => (int) $dr['emp_id'],
                'emp_name' => $dr['emp_name'] ?? null,
            ], $directReports)),
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function buildFilters(Request $request): array
    {
        return [
            'search'  => trim($request->input('search', '')),
            'status'  => trim($request->input('status', '')),
            'tab'     => in_array($request->input('tab'), ['active', 'history']) ? $request->input('tab') : 'active',
            'start'   => $request->input('start'),
            'end'     => $request->input('end'),
            'perPage' => min(100, max(10, (int) $request->input('perPage', 15))),
            'empId'   => $request->input('empId', ''),
        ];
    }

    private function mapIrRow(IrRequest $ir, array $staffMap = []): array
    {
        $byRole        = $ir->approvals->keyBy('role');
        $displayStatus = IrConstants::resolveDisplayStatus(
            $ir,
            $byRole->get(IrConstants::ROLE_HR),
            $byRole->get(IrConstants::ROLE_SV),
            $byRole->get(IrConstants::ROLE_DH),
            $ir->daRequest,
            $ir->reasons->isNotEmpty(),
        );

        $codes = $ir->irList->map(fn($l) => [
            'code_no'    => $l->code_no,
            'violation'  => $l->violation,
            'da_type'    => $l->da_type,
            'offense_no' => $l->offense_no,
        ])->values();

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
    }

    private function paginatedResponse(LengthAwarePaginator $paginator, $items): array
    {
        return [
            'data'         => $items,
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
            'per_page'     => $paginator->perPage(),
            'links'        => $paginator->toArray()['links'] ?? [],
        ];
    }

    public function getIrDetail(int $id): ?array
    {
        $ir = $this->repo->findById($id);
        if (!$ir) return null;

        $byRole        = $ir->approvals->keyBy('role');
        $displayStatus = IrConstants::resolveDisplayStatus(
            $ir,
            $byRole->get(IrConstants::ROLE_HR),
            $byRole->get(IrConstants::ROLE_SV),
            $byRole->get(IrConstants::ROLE_DH),
            $ir->daRequest,
            $ir->reasons->isNotEmpty(),
        );

        // ── Collect all emp_nos that need a display name ──────────────────────
        $approverEmpNos = $ir->approvals
            ->pluck('approver_emp_no')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $extraEmpNos = array_filter([
            $ir->requestor_id,
            $ir->daRequest?->da_requestor_emp_no,
        ]);

        $allEmpNos = array_unique(
            array_merge([$ir->emp_no], $approverEmpNos, $extraEmpNos)
        );

        // ── 2 HTTP calls instead of N+1 ───────────────────────────────────────
        // fetchEmployeesBulk returns (int)emp_no → ['emp_name', ...]
        $nameMap = $this->hris->fetchEmployeesBulk($allEmpNos);

        // Work details are only needed for the IR subject, keep as a single call
        $workRaw = $this->hris->fetchWorkDetails((int) $ir->emp_no);

        return [
            'id'                => $ir->id,
            'ir_no'             => $ir->ir_no,
            'emp_no'            => $ir->emp_no,
            'emp_name'          => $nameMap[$ir->emp_no]['emp_name'] ?? null,
            'company_id'        => (int) ($workRaw['company_id'] ?? 0),
            'company'           => $workRaw['company'] ?? null,
            'shift'             => $workRaw['shift_type'] ?? null,
            'team'              => $workRaw['team'] ?? null,
            'department'        => $workRaw['emp_dept'] ?? null,
            'station'           => $workRaw['emp_station'] ?? null,
            'prodline'          => $workRaw['emp_prodline'] ?? null,
            'position'          => $workRaw['emp_jobtitle'] ?? null,
            'quality_violation' => $ir->quality_violation,
            'reference'         => $ir->reference,
            'what'              => $ir->what,
            'when_date'         => $ir->when_date?->format('Y-m-d'),
            'where_loc'         => $ir->where_loc,
            'how'               => $ir->how,
            'assessment'        => $ir->assessment,
            'recommendation'    => $ir->recommendation,
            'date_created'      => $ir->date_created?->format('Y-m-d H:i'),
            'ir_status'         => $ir->ir_status,
            'is_inactive'       => $ir->is_inactive,
            'display_status'    => $displayStatus,
            'requestor_id'      => $ir->requestor_id,
            'requestor_name'    => $nameMap[$ir->requestor_id]['emp_name'] ?? null,
            'violations'        => $ir->irList->map(fn($l) => [
                'id'                 => $l->id,
                'code_no'            => $l->code_no,
                'violation'          => $l->violation,
                'da_type'            => $l->da_type,
                'date_committed'     => $l->date_committed,
                'offense_no'         => $l->offense_no,
                'valid'              => $l->valid,
                'date_of_suspension' => $l->DATE_of_suspension?->format('Y-m-d'),
                'days_no'            => $l->days_no,
            ])->values(),
            'reasons'           => $ir->reasons->map(fn($r) => [
                'seq'         => $r->seq,
                'reason_text' => $r->reason_text,
            ])->values(),
            'approvals'         => $ir->approvals->map(fn($a) => [
                'role'            => $a->role,
                'approver_emp_no' => (int) $a->approver_emp_no,
                'approver_name'   => $nameMap[(int) $a->approver_emp_no]['emp_name'] ?? null,
                'status'          => $a->status,
                'sign_date'       => $a->sign_date?->format('Y-m-d H:i'),
                'da_sign_date'    => $a->da_sign_date?->format('Y-m-d H:i'),
                'remarks'         => $a->remarks,
            ])->values(),
            'da_request'        => $ir->daRequest ? [
                'da_status'           => $ir->daRequest->da_status,
                'da_requestor_emp_no' => (int) $ir->daRequest->da_requestor_emp_no,
                'da_requestor_name'   => $nameMap[(int) $ir->daRequest->da_requestor_emp_no]['emp_name'] ?? null,
                'da_requested_date'   => $ir->daRequest->da_requested_date?->format('Y-m-d H:i'),
                'acknowledge_da'      => $ir->daRequest->acknowledge_da,
                'acknowledge_date'    => $ir->daRequest->acknowledge_date?->format('Y-m-d H:i'),
            ] : null,
        ];
    }

    public function getCodeNumbersPaginated(int $page = 1, int $perPage = 15): array
    {
        return $this->repo->getActiveCodeNumbersPaginated($page, $perPage);
    }

    /**
     * List IRs for the logged-in HR / HR Manager.
     * tab=action → only records needing their action (default)
     * tab=all    → full history of all IRs
     */
    public function getAdminIrList(Request $request, string $adminRole): array
    {
        $tab = in_array($request->input('tab'), ['action', 'all']) ? $request->input('tab') : 'action';
        $filters = [
            'search'  => trim($request->input('search', '')),
            'status'  => trim($request->input('status', '')),
            'tab'     => $tab,
            'perPage' => min(100, max(10, (int) $request->input('perPage', 15))),
            'start'   => $request->input('start', ''),
            'end'     => $request->input('end', ''),
        ];

        $paginator = $this->repo->listAdminPaginated($adminRole, $filters);

        $empNos = collect($paginator->items())
            ->pluck('emp_no')
            ->unique()
            ->values()
            ->all();

        $staffMap = $this->hris->fetchEmployeesBulk($empNos);

        $items = collect($paginator->items())->map(fn(IrRequest $ir) => $this->mapIrRow($ir, $staffMap));

        return $this->paginatedResponse($paginator, $items);
    }

    /**
     * Load the full IrRequest model (with eager loads) for action methods.
     */
    public function getIrModel(int $id): ?IrRequest
    {
        return $this->repo->findById($id);
    }

    /**
     * Determine the logged-in user's role relative to a specific IR.
     *
     * Priority:
     *  1. Reported employee        → 'employee'
     *  2. ir_admins table          → 'hr' or 'hr_mngr'  (maintainable by client)
     *  3. HRIS approver1 of emp    → 'sv'  (supervisor)
     *  4. HRIS approver2 of emp    → 'dh'  (dept head)
     *  5. No match                 → null  (view only)
     */
    public function resolveCurrentUserRole(IrRequest $ir, int $empId): ?string
    {
        if ((int) $ir->emp_no === $empId) return 'employee';

        // Check ir_admins — HR personnel and HR Manager are maintained here
        $adminRole = IrAdmin::roleFor($empId);
        if ($adminRole) return $adminRole;

        // SV and DH come from HRIS — these rows only exist in ir_approvals after action
        $approvers = $this->hris->fetchApprovers((int) $ir->emp_no);
        if ($approvers) {
            if ((int) ($approvers['approver1_id'] ?? 0) === $empId) return 'sv';
            if ((int) ($approvers['approver2_id'] ?? 0) === $empId) return 'dh';
        }

        return null;
    }

    // ── Step 2: HR Validation ─────────────────────────────────────────────────

    public function validateIr(IrRequest $ir, int $hrEmpNo, bool $approved, string $remarks): void
    {
        // Write HR emp_no into ir_approvals on first action
        $this->repo->ensureApproval($ir->ir_no, IrConstants::ROLE_HR, $hrEmpNo);

        if ($approved) {
            $this->repo->updateApprovalStatus(
                $ir->ir_no,
                IrConstants::ROLE_HR,
                IrConstants::APPROVAL_APPROVED,
                null,
                now()
            );
            $this->repo->updateIrStatus($ir, IrConstants::IR_VALIDATED);
        } else {
            $this->repo->updateApprovalStatus(
                $ir->ir_no,
                IrConstants::ROLE_HR,
                IrConstants::APPROVAL_DISAPPROVED,
                $remarks
            );
        }
    }

    // ── Step 4: Employee submits Letter of Explanation ────────────────────────

    public function submitLoe(IrRequest $ir, array $reasons): void
    {
        $this->repo->replaceLoe($ir->ir_no, $reasons);
    }

    // ── Step 5: Supervisor Assessment ─────────────────────────────────────────

    public function supervisorAssess(
        IrRequest $ir,
        int $svEmpNo,
        string $assessment,
        string $recommendation
    ): void {
        $this->repo->ensureApproval($ir->ir_no, IrConstants::ROLE_SV, $svEmpNo);

        $this->repo->updateIrStatus($ir, IrConstants::IR_VALIDATED, [
            'assessment'     => $assessment,
            'recommendation' => $recommendation,
        ]);

        $this->repo->updateApprovalStatus(
            $ir->ir_no,
            IrConstants::ROLE_SV,
            IrConstants::APPROVAL_APPROVED,
            null,
            now()
        );
    }

    // ── Step 5 (cont.): HR Re-validation ─────────────────────────────────────
    // After SV assesses, HR reviews again and marks da_sign_date on their approval row.
    // This does NOT change ir_status — it just unlocks the DH sign-off step.

    public function hrRevalidate(IrRequest $ir, int $hrEmpNo, bool $proceed, string $remarks = ''): void
    {
        $this->repo->ensureApproval($ir->ir_no, IrConstants::ROLE_HR, $hrEmpNo);

        if ($proceed) {
            // Mark re-validation done via da_sign_date (ir_status stays IR_VALIDATED until DH signs)
            $this->repo->setApprovalDaSignDate($ir->ir_no, IrConstants::ROLE_HR, now());
        } else {
            // Reject → close the case as invalid
            $this->repo->updateApprovalStatus(
                $ir->ir_no,
                IrConstants::ROLE_HR,
                IrConstants::APPROVAL_DISAPPROVED,
                $remarks
            );
            $this->repo->updateIrStatus($ir, IrConstants::IR_INVALID);
        }
    }

    // ── Step 6: Dept Head IR Sign-off ────────────────────────────────────────
    // DH is the final IR-phase sign-off. When they approve, ir_status → IR_APPROVED (2)
    // which opens the DA phase.

    public function deptHeadReview(
        IrRequest $ir,
        int $dhEmpNo,
        bool $approved,
        ?string $remarks
    ): void {
        $this->repo->ensureApproval($ir->ir_no, IrConstants::ROLE_DH, $dhEmpNo);

        $status = $approved
            ? IrConstants::IR_APPROVED
            : IrConstants::IR_INVALID;

        $this->repo->updateIrStatus($ir, $status, [
            'dh_remarks' => $remarks,
        ]);

        $this->repo->updateApprovalStatus(
            $ir->ir_no,
            IrConstants::ROLE_DH,
            $approved
                ? IrConstants::APPROVAL_APPROVED
                : IrConstants::APPROVAL_DISAPPROVED,
            $remarks,
            now()
        );
    }
    // ── Step 9: HR Issues DA ─────────────────────────────────────────────────

    public function issueDa(IrRequest $ir, int $hrEmpNo): void
    {
        if (!$ir->daRequest) {
            $this->repo->createDaRequest($ir->ir_no, $hrEmpNo);
        }
    }

    // ── Step 10: HR Manager Approves DA ──────────────────────────────────────

    public function hrManagerApprove(IrRequest $ir, int $hrMngrEmpNo): void
    {
        $this->repo->ensureApproval($ir->ir_no, IrConstants::ROLE_HR_MNGR, $hrMngrEmpNo);
        $this->repo->updateApprovalStatus(
            $ir->ir_no,
            IrConstants::ROLE_HR_MNGR,
            IrConstants::APPROVAL_APPROVED,
            null,
            now()
        );
        $this->repo->updateDaStatus($ir->ir_no, IrConstants::DA_FOR_SUPERVISOR);
    }

    // ── Step 11a: Supervisor Acknowledges DA ──────────────────────────────────

    public function svAcknowledge(IrRequest $ir, int $svEmpNo): void
    {
        $this->repo->ensureApproval($ir->ir_no, IrConstants::ROLE_SV, $svEmpNo);
        $this->repo->updateApprovalStatus(
            $ir->ir_no,
            IrConstants::ROLE_SV,
            IrConstants::APPROVAL_APPROVED,
            null,
            null
        );
        $this->repo->setApprovalDaSignDate($ir->ir_no, IrConstants::ROLE_SV, now());
        $this->repo->updateDaStatus($ir->ir_no, IrConstants::DA_FOR_DEPT_MANAGER);
    }

    // ── Step 11b: Dept Manager Acknowledges DA ────────────────────────────────

    public function dmAcknowledge(IrRequest $ir, int $dhEmpNo): void
    {
        $this->repo->ensureApproval($ir->ir_no, IrConstants::ROLE_DH, $dhEmpNo);
        $this->repo->updateApprovalStatus(
            $ir->ir_no,
            IrConstants::ROLE_DH,
            IrConstants::APPROVAL_APPROVED,
            null,
            null
        );
        $this->repo->setApprovalDaSignDate($ir->ir_no, IrConstants::ROLE_DH, now());
        $this->repo->updateDaStatus($ir->ir_no, IrConstants::DA_FOR_ACKNOWLEDGEMENT);
    }

    // ── Step 11c: Employee Acknowledges DA ───────────────────────────────────

    public function employeeAcknowledge(IrRequest $ir): void
    {
        $this->repo->updateDaStatus($ir->ir_no, IrConstants::DA_ACKNOWLEDGED, [
            'acknowledge_da'   => true,
            'acknowledge_date' => now(),
        ]);
    }

    /**
     * Compute which actions are available for the current user on this IR.
     * Single source of truth — frontend reads these flags from props.
     */
    public function resolveAvailableActions(IrRequest $ir, ?string $currentUserRole, int $empId, ?int $companyId = null): array
    {
        $byRole     = $ir->approvals->keyBy('role');
        $hrApproval = $byRole->get(IrConstants::ROLE_HR);
        $svApproval = $byRole->get(IrConstants::ROLE_SV);
        $dhApproval = $byRole->get(IrConstants::ROLE_DH);
        $da         = $ir->daRequest;
        $hasLoe     = $ir->reasons->isNotEmpty();

        // Employees from these companies go through IR only — no DA phase.
        $isIrOnly = $companyId !== null && in_array($companyId, IrConstants::IR_ONLY_COMPANY_IDS);

        return [
            // ── IR Phase ──────────────────────────────────────────────────────
            'hrCanValidate'      => $currentUserRole === IrConstants::ROLE_HR
                && $ir->ir_status === IrConstants::IR_PENDING
                && $hrApproval?->status !== IrConstants::APPROVAL_APPROVED,

            'requestorCanEdit'   => (int) $ir->requestor_id === $empId
                && $ir->ir_status === IrConstants::IR_PENDING
                && $hrApproval?->status === IrConstants::APPROVAL_DISAPPROVED,

            'empCanSubmitLoe'    => $currentUserRole === 'employee'
                && $ir->ir_status === IrConstants::IR_VALIDATED
                && !$hasLoe,

            'svCanAssess'        => $currentUserRole === IrConstants::ROLE_SV
                && $ir->ir_status === IrConstants::IR_VALIDATED
                && $hasLoe
                && (!$svApproval || $svApproval->status !== IrConstants::APPROVAL_APPROVED),

            'hrCanRevalidate'    => $currentUserRole === IrConstants::ROLE_HR
                && $ir->ir_status === IrConstants::IR_VALIDATED
                && $svApproval?->status === IrConstants::APPROVAL_APPROVED
                && !$hrApproval?->da_sign_date,

            'dhCanReview'        => $currentUserRole === IrConstants::ROLE_DH
                && $ir->ir_status === IrConstants::IR_VALIDATED
                && (bool) $hrApproval?->da_sign_date
                && $dhApproval?->status !== IrConstants::APPROVAL_APPROVED,

            // ── DA Phase — blocked for IR-only companies ──────────────────────
            'hrCanIssueDa'       => !$isIrOnly
                && $currentUserRole === IrConstants::ROLE_HR
                && $ir->ir_status === IrConstants::IR_APPROVED
                && !$da,

            'hrMngrCanApproveDa' => !$isIrOnly
                && $currentUserRole === IrConstants::ROLE_HR_MNGR
                && $ir->ir_status === IrConstants::IR_APPROVED
                && $da?->da_status === IrConstants::DA_FOR_HR_MANAGER,

            'svCanAckDa'         => !$isIrOnly
                && $currentUserRole === IrConstants::ROLE_SV
                && $ir->ir_status === IrConstants::IR_APPROVED
                && $da?->da_status === IrConstants::DA_FOR_SUPERVISOR,

            'dhCanAckDa'         => !$isIrOnly
                && $currentUserRole === IrConstants::ROLE_DH
                && $ir->ir_status === IrConstants::IR_APPROVED
                && $da?->da_status === IrConstants::DA_FOR_DEPT_MANAGER,

            'empCanAckDa'        => !$isIrOnly
                && $currentUserRole === 'employee'
                && $ir->ir_status === IrConstants::IR_APPROVED
                && $da?->da_status === IrConstants::DA_FOR_ACKNOWLEDGEMENT,
        ];
    }

    /**
     * Fetch just the company_id for an employee from HRIS work details.
     * Used as a lightweight guard before DA actions.
     */
    public function getEmployeeCompanyId(IrRequest $ir): ?int
    {
        $work = $this->hris->fetchWorkDetails((int) $ir->emp_no);
        return isset($work['company_id']) ? (int) $work['company_id'] : null;
    }

    public function resubmitIr(IrRequest $ir, array $data): void
    {
        $this->repo->resubmitIr($ir, $data);
    }

    /**
     * Apply a bulk action to a set of IRs (or all matching the admin's action-item filter).
     * Returns the count of records actually processed.
     */
    public function bulkAction(string $adminRole, array $data, int $empId): int
    {
        if (!empty($data['select_all'])) {
            $filters = array_merge(['tab' => 'action', 'perPage' => 9999], $data['filters'] ?? []);
            $filters['tab'] = 'action'; // always action tab for bulk
            $paginator = $this->repo->listAdminPaginated($adminRole, $filters);
            $ids = collect($paginator->items())->pluck('id')->all();
        } else {
            $ids = array_unique(array_map('intval', $data['ids'] ?? []));
        }

        if (empty($ids)) return 0;

        $count   = 0;
        $remarks = trim($data['remarks'] ?? '');

        foreach ($ids as $id) {
            $ir = $this->repo->findById((int) $id);
            if (!$ir) continue;

            // Verify this ID is actually actionable for this role (prevent spoofing)
            $role = $this->resolveAdminBulkRole($adminRole, $ir);
            if (!$role) continue;

            match ($data['action']) {
                'validate_valid'   => $this->validateIr($ir, $empId, true, ''),
                'validate_invalid' => $this->validateIr($ir, $empId, false, $remarks),
                'approve_da'       => $this->hrManagerApprove($ir, $empId),
                default            => null,
            };

            $count++;
        }

        return $count;
    }

    /** Confirm the IR is in the expected state for this admin's bulk action. */
    private function resolveAdminBulkRole(string $adminRole, IrRequest $ir): bool
    {
        if ($adminRole === 'hr') {
            return $ir->ir_status === IrConstants::IR_PENDING
                && $ir->approvals->where('role', 'hr')->where('status', IrConstants::APPROVAL_DISAPPROVED)->isEmpty();
        }
        if ($adminRole === 'hr_mngr') {
            return $ir->ir_status === IrConstants::IR_APPROVED
                && $ir->daRequest?->da_status === IrConstants::DA_FOR_HR_MANAGER;
        }
        return false;
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
