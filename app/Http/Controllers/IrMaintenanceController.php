<?php

namespace App\Http\Controllers;

use App\Models\IrAdmin;
use App\Services\IrMaintenanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IrMaintenanceController extends Controller
{
    public function __construct(
        protected IrMaintenanceService $service
    ) {}

    /** Only HR personnel can access maintenance pages. */
    private function assertHr(): void
    {
        $empId = (int) session('emp_data.emp_id');
        if (IrAdmin::roleFor($empId) !== 'hr') abort(403);
    }

    // ── IR Admin Management ───────────────────────────────────────────────────

    public function admins(): Response
    {
        $this->assertHr();
        return Inertia::render('IR/Maintenance/AdminMaintenance', [
            'admins' => fn () => $this->service->getAdminList(),
            'roles'  => ['hr' => 'HR Personnel', 'hr_mngr' => 'HR Manager'],
        ]);
    }

    public function adminStore(Request $request): RedirectResponse
    {
        $this->assertHr();
        $data = $request->validate([
            'emp_no' => 'required|integer',
            'role'   => 'required|string|in:hr,hr_mngr',
        ]);

        try {
            $this->service->createAdmin((int) $data['emp_no'], $data['role']);
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Admin added successfully.');
    }

    public function adminUpdate(Request $request, int $id): RedirectResponse
    {
        $this->assertHr();
        $data = $request->validate([
            'role' => 'required|string|in:hr,hr_mngr',
        ]);

        try {
            $this->service->updateAdmin($id, $data['role']);
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Admin role updated.');
    }

    public function adminToggle(int $id): RedirectResponse
    {
        $this->assertHr();
        $this->service->toggleAdmin($id);
        return back()->with('success', 'Admin status updated.');
    }

    public function adminDelete(int $id): RedirectResponse
    {
        $this->assertHr();
        $this->service->deleteAdmin($id);
        return back()->with('success', 'Admin removed.');
    }

    // ── Code Number Management ────────────────────────────────────────────────

    public function codes(Request $request): Response
    {
        $this->assertHr();
        return Inertia::render('IR/Maintenance/CodeMaintenance', [
            'codes'   => fn () => $this->service->getCodeList($request),
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function codeStore(Request $request): RedirectResponse
    {
        $this->assertHr();
        $data = $request->validate([
            'code_number'    => 'required|string|max:50',
            'violation'      => 'required|string|max:500',
            'category'       => 'nullable|string|max:100',
            'root_cause'     => 'nullable|string|max:500',
            'first_offense'  => 'nullable|string|max:100',
            'second_offense' => 'nullable|string|max:100',
            'third_offense'  => 'nullable|string|max:100',
            'fourth_offense' => 'nullable|string|max:100',
            'fifth_offense'  => 'nullable|string|max:100',
        ]);

        $this->service->createCode($data);
        return back()->with('success', 'Code number added.');
    }

    public function codeUpdate(Request $request, int $id): RedirectResponse
    {
        $this->assertHr();
        $data = $request->validate([
            'code_number'    => 'required|string|max:50',
            'violation'      => 'required|string|max:500',
            'category'       => 'nullable|string|max:100',
            'root_cause'     => 'nullable|string|max:500',
            'first_offense'  => 'nullable|string|max:100',
            'second_offense' => 'nullable|string|max:100',
            'third_offense'  => 'nullable|string|max:100',
            'fourth_offense' => 'nullable|string|max:100',
            'fifth_offense'  => 'nullable|string|max:100',
        ]);

        try {
            $this->service->updateCode($id, $data);
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Code number updated.');
    }

    public function codeToggle(int $id): RedirectResponse
    {
        $this->assertHr();
        $this->service->toggleCode($id);
        return back()->with('success', 'Code status updated.');
    }
}
