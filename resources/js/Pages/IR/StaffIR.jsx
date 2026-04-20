import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { Users, Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { format } from "date-fns";
import { useRef } from "react";

import { Pagination }      from "@/Components/Pagination";
import { CodesCell }       from "@/Components/CodesCell";
import { useStaffFilters } from "./hooks/useStaffFilters";
import { IrStatusBadge }   from "./components/IrStatusBadge";

export default function StaffIR({ irList, filters: initialFilters, statusOptions }) {
    const { filters, applyFilters, clearFilters, switchTab, goToPage } = useStaffFilters(initialFilters);
    const searchRef     = useRef(null);
    const directReports = irList?.direct_reports ?? [];
    const hasFilters    = filters.search || filters.status || filters.start || filters.end || filters.empId;

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({ search: searchRef.current?.value ?? "" });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Staff Incident Reports" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <Users className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Staff Incident Reports</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {irList?.total ?? 0} record{irList?.total !== 1 ? "s" : ""}
                            {directReports.length > 0 && (
                                <span className="ml-1">
                                    · {directReports.length} direct report{directReports.length !== 1 ? "s" : ""}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* No direct reports */}
            {directReports.length === 0 && (
                <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                    <Users className="mx-auto mb-3 w-8 h-8 opacity-30" />
                    <p className="font-medium">No direct reports found</p>
                    <p className="text-xs mt-1">You do not have any staff assigned under you.</p>
                </div>
            )}

            {directReports.length > 0 && (<>

                {/* Tabs */}
                <div className="flex gap-1 border-b mb-4">
                    {[
                        { key: "active",  label: "Active"  },
                        { key: "history", label: "History" },
                    ].map(({ key, label }) => (
                        <button key={key} onClick={() => switchTab(key)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                filters.tab === key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-0">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                defaultValue={filters.search}
                                placeholder="Search IR No., Emp No., Code or Violation…"
                                className="pl-8 h-9 text-sm"
                            />
                        </div>
                        <Button type="submit" size="sm" className="h-9 px-4">Search</Button>
                    </form>

                    <div className="flex gap-2 items-center flex-wrap">
                        {/* Employee filter */}
                        <select
                            value={filters.empId}
                            onChange={(e) => applyFilters({ empId: e.target.value })}
                            className="h-9 px-3 text-sm border border-input bg-background rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer min-w-[170px]"
                        >
                            <option value="">All Staff</option>
                            {directReports.map((dr) => (
                                <option key={dr.emp_id} value={dr.emp_id}>
                                    {dr.emp_name ?? `#${dr.emp_id}`}
                                </option>
                            ))}
                        </select>

                        {/* Status filter */}
                        <div className="relative">
                            <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                            <select
                                value={filters.status}
                                onChange={(e) => applyFilters({ status: e.target.value })}
                                className="h-9 pl-8 pr-8 text-sm border border-input bg-background rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer min-w-[170px]"
                            >
                                <option value="">All Statuses</option>
                                {(statusOptions ?? []).map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Per-page */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            Show
                            <select
                                value={filters.perPage}
                                onChange={(e) => applyFilters({ perPage: Number(e.target.value) })}
                                className="h-7 px-2 text-xs border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                {[10, 15, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>

                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}
                                className="h-9 gap-1.5 text-muted-foreground hover:text-foreground">
                                <X className="w-3.5 h-3.5" /> Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Active filter badges */}
                {(filters.status || filters.empId) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {filters.empId && (
                            <Badge variant="secondary" className="text-xs gap-1">
                                <Users className="w-3 h-3" />
                                {directReports.find((d) => String(d.emp_id) === String(filters.empId))?.emp_name ?? `#${filters.empId}`}
                            </Badge>
                        )}
                        {filters.status && (
                            <Badge variant="secondary" className="text-xs gap-1">
                                <SlidersHorizontal className="w-3 h-3" />
                                {filters.status}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Table */}
                <div className="rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[860px]">
                            <thead>
                                <tr className="bg-muted/40 border-b">
                                    {["IR No.", "Date Filed", "Employee", "Department", "Code / Violation", "Status", "Action"].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(irList?.data ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                            No incident reports found.
                                        </td>
                                    </tr>
                                ) : (
                                    (irList?.data ?? []).map((ir) => (
                                        <tr key={ir.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">{ir.ir_no}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {ir.date_created ? format(new Date(ir.date_created), "MM-dd-yyyy") : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium leading-tight">{ir.emp_name ?? `#${ir.emp_no}`}</div>
                                                <div className="text-xs text-muted-foreground font-mono">#{ir.emp_no}</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {ir.department ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <CodesCell codes={ir.codes} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <IrStatusBadge status={ir.display_status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button variant="outline" size="sm" className="h-7 text-xs"
                                                    onClick={() => router.get(route("ir.show", btoa(ir.id)))}>
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    meta={{
                        current_page: irList?.current_page,
                        last_page:    irList?.last_page,
                        from:         irList?.from,
                        to:           irList?.to,
                        total:        irList?.total,
                    }}
                    onPageChange={goToPage}
                />
            </>)}
        </AuthenticatedLayout>
    );
}
