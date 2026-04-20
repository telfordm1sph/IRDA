<?php

namespace App\Http\Controllers;

use App\Constants\IrConstants;
use App\Services\IrRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IrController extends Controller
{
    public function __construct(
        protected IrRequestService $service
    ) {}

    public function index(Request $request): Response
    {
        $empId = (int) session('emp_data.emp_id');

        return Inertia::render('IR/IndexIR', [
            'irList'        => fn() => $this->service->getMyIrList($request, $empId),
            'filters'       => $request->only(['search', 'status', 'tab', 'start', 'end', 'perPage']),
            'statusOptions' => IrConstants::IR_DISPLAY_STATUSES,
        ]);
    }

    public function staff(Request $request): Response
    {
        $empId = (int) session('emp_data.emp_id');

        return Inertia::render('IR/StaffIR', [
            'irList'        => fn() => $this->service->getStaffIrList($request, $empId),
            'filters'       => $request->only(['search', 'status', 'tab', 'start', 'end', 'perPage', 'empId']),
            'statusOptions' => IrConstants::IR_DISPLAY_STATUSES,
        ]);
    }

    public function show(string $hash): Response
    {
        $empId = (int) session('emp_data.emp_id');
        $id    = (int) base64_decode($hash);

        if (!$id) abort(404);

        $irModel = $this->service->getIrModel($id);
        if (!$irModel) abort(404);

        $ir               = $this->service->getIrDetail($id);
        $currentUserRole  = $this->service->resolveCurrentUserRole($irModel, $empId);
        $availableActions = $this->service->resolveAvailableActions($irModel, $currentUserRole, $empId, $ir['company_id'] ?? null);

        return Inertia::render('IR/ShowIR', [
            'ir'               => $ir,
            'hash'             => $hash,
            'daTypes'          => IrConstants::DA_TYPES,
            'currentUserRole'  => $currentUserRole,
            'currentEmpId'     => $empId,
            'isRequestor'      => (int) $irModel->requestor_id === $empId,
            'availableActions' => $availableActions,
        ]);
    }

    public function showDa(string $hash): Response|\Illuminate\Http\RedirectResponse
    {
        $empId   = $this->currentEmpId();
        $id      = (int) base64_decode($hash);
        if (!$id) abort(404);

        $irModel = $this->service->getIrModel($id);
        if (!$irModel) abort(404);

        // DA view only available once IR is approved and DA has been issued
        if ($irModel->ir_status !== IrConstants::IR_APPROVED || !$irModel->daRequest) {
            return redirect()->route('ir.show', $hash);
        }

        $ir               = $this->service->getIrDetail($id);

        // IR-only companies never have a DA — redirect back to IR view
        if (in_array((int) ($ir['company_id'] ?? 0), IrConstants::IR_ONLY_COMPANY_IDS)) {
            return redirect()->route('ir.show', $hash);
        }

        $currentUserRole  = $this->service->resolveCurrentUserRole($irModel, $empId);
        $availableActions = $this->service->resolveAvailableActions($irModel, $currentUserRole, $empId, $ir['company_id'] ?? null);

        return Inertia::render('IR/ShowDA', [
            'ir'               => $ir,
            'hash'             => $hash,
            'currentUserRole'  => $currentUserRole,
            'currentEmpId'     => $empId,
            'availableActions' => $availableActions,
        ]);
    }

    // ── Process action helpers ─────────────────────────────────────────────────

    private function resolveIrModel(string $hash): \App\Models\IrRequest
    {
        $id = (int) base64_decode($hash);
        if (!$id) abort(404);
        $ir = $this->service->getIrModel($id);
        if (!$ir) abort(404);
        return $ir;
    }

    private function currentEmpId(): int
    {
        return (int) session('emp_data.emp_id');
    }

    private function assertRole(\App\Models\IrRequest $ir, string ...$allowed): void
    {
        $role = $this->service->resolveCurrentUserRole($ir, $this->currentEmpId());
        if (!in_array($role, $allowed, true)) abort(403);
    }

    // ── Step 2: HR validates IR ───────────────────────────────────────────────

    public function validateIr(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'hr');

        $data = $request->validate([
            'approved' => 'required|boolean',
            'remarks'  => 'nullable|string|max:1000',
        ]);

        $this->service->validateIr($ir, $this->currentEmpId(), (bool) $data['approved'], $data['remarks'] ?? '');

        return redirect()->route('ir.show', $hash)
            ->with('success', $data['approved'] ? 'IR validated successfully.' : 'IR has been rejected.');
    }

    // ── Step 4: Employee submits LOE ──────────────────────────────────────────

    public function submitLoe(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'employee');

        $data = $request->validate([
            'reasons'   => 'required|array|size:5',
            'reasons.*' => 'required|string|max:2000',
        ]);

        $this->service->submitLoe($ir, $data['reasons']);

        return redirect()->route('ir.show', $hash)
            ->with('success', 'Letter of Explanation submitted.');
    }

    // ── Step 5: Supervisor assessment ─────────────────────────────────────────

    public function supervisorAssess(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'sv');

        $data = $request->validate([
            'assessment'     => 'required|string|max:3000',
            'recommendation' => 'required|string|max:3000',
        ]);

        $this->service->supervisorAssess(
            $ir,
            $this->currentEmpId(),
            $data['assessment'],
            $data['recommendation']
        );

        return redirect()->route('ir.show', $hash)
            ->with('success', 'Assessment submitted.');
    }

    // ── Step 6: Dept Head review ──────────────────────────────────────────────

    public function deptHeadReview(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'dh');

        $data = $request->validate([
            'approved' => 'required|boolean',
            'remarks'  => 'nullable|string|max:3000',
        ]);

        $this->service->deptHeadReview(
            $ir,
            $this->currentEmpId(),
            $data['approved'],
            $data['remarks'] ?? null
        );

        return redirect()->route('ir.show', $hash)
            ->with('success', 'Department head decision submitted.');
    }
    // ── Step 7: HR re-validation ──────────────────────────────────────────────

    public function hrRevalidate(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'hr');

        $data = $request->validate([
            'proceed' => 'required|boolean',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $this->service->hrRevalidate($ir, $this->currentEmpId(), (bool) $data['proceed'], $data['remarks'] ?? '');

        return redirect()->route('ir.show', $hash)
            ->with('success', $data['proceed'] ? 'IR approved — proceed to DA.' : 'IR closed as invalid.');
    }

    // ── Step 9: HR issues DA ──────────────────────────────────────────────────

    public function issueDa(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'hr');

        // Server-side guard: IR-only companies cannot receive a DA
        $companyId = $this->service->getEmployeeCompanyId($ir);
        if (in_array($companyId, IrConstants::IR_ONLY_COMPANY_IDS)) {
            return redirect()->route('ir.show', $hash)
                ->with('error', 'Disciplinary Action is not applicable for employees of this company.');
        }

        $this->service->issueDa($ir, $this->currentEmpId());

        return redirect()->route('ir.show', $hash)
            ->with('success', 'Disciplinary Action issued.');
    }

    // ── Step 10: HR Manager approves DA ──────────────────────────────────────

    public function hrManagerApprove(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'hr_mngr');

        $this->service->hrManagerApprove($ir, $this->currentEmpId());

        return redirect()->route('ir.show.da', $hash)
            ->with('success', 'DA approved by HR Manager.');
    }

    // ── Step 11a: Supervisor acknowledges DA ──────────────────────────────────

    public function svAcknowledge(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'sv');

        $this->service->svAcknowledge($ir, $this->currentEmpId());

        return redirect()->route('ir.show.da', $hash)
            ->with('success', 'DA acknowledged by Supervisor.');
    }

    // ── Step 11b: Dept Manager acknowledges DA ────────────────────────────────

    public function dmAcknowledge(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'dm', 'dh');

        $this->service->dmAcknowledge($ir, $this->currentEmpId());

        return redirect()->route('ir.show.da', $hash)
            ->with('success', 'DA acknowledged by Department Manager.');
    }

    // ── Step 11c: Employee acknowledges DA ───────────────────────────────────

    public function employeeAcknowledge(Request $request, string $hash): RedirectResponse
    {
        $ir = $this->resolveIrModel($hash);
        $this->assertRole($ir, 'employee');

        $this->service->employeeAcknowledge($ir);

        return redirect()->route('ir.show.da', $hash)
            ->with('success', 'You have acknowledged the Disciplinary Action.');
    }

    // ── Edit IR (requestor edits after disapproval) ───────────────────────────

    public function edit(string $hash): Response|RedirectResponse
    {
        $empId   = $this->currentEmpId();
        $ir      = $this->resolveIrModel($hash);

        if ((int) $ir->requestor_id !== $empId) abort(403);
        if ($ir->ir_status !== IrConstants::IR_PENDING) return redirect()->route('ir.show', $hash);

        $hrApproval = $ir->approvals->where('role', IrConstants::ROLE_HR)->first();
        if ($hrApproval?->status !== IrConstants::APPROVAL_DISAPPROVED) return redirect()->route('ir.show', $hash);

        return Inertia::render('IR/EditIR', [
            'ir'      => $this->service->getIrDetail($ir->id),
            'hash'    => $hash,
            'daTypes' => IrConstants::DA_TYPES,
        ]);
    }

    public function resubmit(Request $request, string $hash): RedirectResponse
    {
        $empId = $this->currentEmpId();
        $ir    = $this->resolveIrModel($hash);

        if ((int) $ir->requestor_id !== $empId) abort(403);
        if ($ir->ir_status !== IrConstants::IR_PENDING) abort(403);

        $hrApproval = $ir->approvals->where('role', IrConstants::ROLE_HR)->first();
        if ($hrApproval?->status !== IrConstants::APPROVAL_DISAPPROVED) abort(403);

        $data = $request->validate([
            'reference'                => 'nullable|string|max:500',
            'what'                     => 'required|string|max:5000',
            'when_date'                => 'required|date',
            'where_loc'                => 'required|string|max:500',
            'how'                      => 'required|string|max:5000',
            'items'                    => 'required|array|min:1',
            'items.*.code_no'          => 'required|string|max:250',
            'items.*.violation'        => 'required|string|max:1000',
            'items.*.da_type'          => 'required|integer|min:1',
            'items.*.date_committed'   => 'required|array|min:1',
            'items.*.date_committed.*' => 'required|date',
            'items.*.offense_no'       => 'nullable|string|max:250',
        ]);

        $this->service->resubmitIr($ir, $data);

        return redirect()->route('ir.show', $hash)
            ->with('success', 'IR updated and resubmitted for HR validation.');
    }

    // ── Bulk action (HR / HR Manager) ─────────────────────────────────────────

    public function bulkAction(Request $request): RedirectResponse
    {
        $empId     = $this->currentEmpId();
        $adminRole = \App\Models\IrAdmin::roleFor($empId);
        if (!$adminRole) abort(403);

        $data = $request->validate([
            'action'     => 'required|string|in:validate_valid,validate_invalid,approve_da',
            'ids'        => 'array',
            'ids.*'      => 'integer',
            'select_all' => 'boolean',
            'filters'    => 'nullable|array',
            'remarks'    => 'nullable|string|max:1000',
        ]);

        $count = $this->service->bulkAction($adminRole, $data, $empId);

        return back()->with('success', "{$count} record(s) updated.");
    }

    public function adminList(Request $request): Response
    {
        $empId     = $this->currentEmpId();
        $adminRole = \App\Models\IrAdmin::roleFor($empId);

        if (!$adminRole) abort(403);

        return Inertia::render('IR/AdminIR', [
            'irList'        => fn() => $this->service->getAdminIrList($request, $adminRole),
            'filters'       => $request->only(['search', 'status', 'tab', 'perPage']),
            'adminRole'     => $adminRole,
            'statusOptions' => IrConstants::IR_DISPLAY_STATUSES,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('IR/CreateIR', [
            'daTypes'   => IrConstants::DA_TYPES,
            'irStatuses' => IrConstants::IR_STATUS_LABELS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'emp_no'                      => 'required|integer',
            'quality_violation'           => 'required|boolean',
            'reference'                   => 'nullable|string|max:500',
            'what'                        => 'required|string|max:5000',
            'when_date'                   => 'required|date',
            'where_loc'                   => 'required|string|max:500',
            'how'                         => 'required|string|max:5000',
            'items'                       => 'required|array|min:1',
            'items.*.code_no'               => 'required|string|max:250',
            'items.*.violation'             => 'required|string|max:1000',
            'items.*.da_type'               => 'required|integer|min:1',
            'items.*.date_committed'        => 'required|array|min:1',
            'items.*.date_committed.*'      => 'required|date',
            'items.*.offense_no'            => 'nullable|string|max:250',
            'approvals'                   => 'nullable|array',
            'approvals.*.role'            => 'required|string|in:' . implode(',', IrConstants::APPROVAL_ROLES),
            'approvals.*.approver_emp_no' => 'nullable|integer',
        ]);

        $requestorId = (int) session('emp_data.emp_id');

        $ir = $this->service->store($validated, $requestorId);

        return redirect()
            ->route('ir.create')
            ->with('success', "Incident Report {$ir->ir_no} submitted successfully.");
    }

    public function searchEmployees(Request $request): JsonResponse
    {
        $query   = trim($request->get('q', ''));
        $page    = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(10, (int) $request->get('per_page', 20)));

        return response()->json(
            $this->service->fetchActiveEmployees($query, $page, $perPage)
        );
    }

    public function employeeWorkDetails(int $employid): JsonResponse
    {
        return response()->json($this->service->fetchWorkDetails($employid));
    }

    public function codeNumbers(Request $request): JsonResponse
    {
        $page    = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(10, (int) $request->get('per_page', 15)));

        return response()->json(
            $this->service->getCodeNumbersPaginated($page, $perPage)
        );
    }
}
