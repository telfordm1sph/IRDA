<?php

namespace App\Http\Middleware;

use App\Models\IrAdmin;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'emp_data'      => fn() => session('emp_data'),
            'ir_admin_role' => fn() => ($empNo = (int) session('emp_data.emp_id'))
                ? IrAdmin::roleFor($empNo)
                : null,
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error'   => fn() => $request->session()->get('error'),
            ],
            'auth' => [
                'user' => $request->user(),
            ],
            'appName' => config('app.name'), // This pulls from .env
            'display_name' => env('APP_DISPLAY_NAME', ''),
        ];
    }
}
