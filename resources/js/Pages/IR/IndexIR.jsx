import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { FileWarning, FilePlus, Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { format } from "date-fns";
import { useRef } from "react";

import { useIrFilters }  from "./hooks/useIrFilters";
import { IrStatusBadge } from "./components/IrStatusBadge";
import { DA_TYPES }      from "./components/IrConstants";

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ meta, onPageChange }) {
    if (!meta || meta.last_page <= 1) return null;
    const { current_page, last_page, from, to, total } = meta;
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 mt-4">
            <p className="text-xs text-muted-foreground">
                Showing {from ?? 0}–{to ?? 0} of {total ?? 0}
            </p>
            <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={current_page === 1}
                    onClick={() => onPageChange(current_page - 1)} className="h-8 px-3 text-xs">
                    Previous
                </Button>
                <span className="text-xs text-muted-foreground px-2">{current_page} / {last_page}</span>
                <Button variant="outline" size="sm" disabled={current_page === last_page}
                    onClick={() => onPageChange(current_page + 1)} className="h-8 px-3 text-xs">
                    Next
                </Button>
            </div>
        </div>
    );
}

// ── Codes cell ────────────────────────────────────────────────────────────────

function CodesCell({ codes }) {
    if (!codes?.length) return <span className="text-muted-foreground text-xs">—</span>;
    return (
        <div className="space-y-1">
            {codes.map((c, i) => (
                <div key={i} className="text-xs">
                    <span className="font-medium font-mono">{c.code_no}</span>
                    {c.violation && (
                        <span className="text-muted-foreground ml-1">— {c.violation}</span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function IndexIR({ irList, filters: initialFilters, statusOptions }) {
    const { filters, applyFilters, clearFilters } = useIrFilters(initialFilters);
    const searchRef = useRef(null);
    const hasActiveFilters = filters.search || filters.status || filters.start || filters.end || filters.empId;
    const activeTab = filters.tab ?? "active";

    const isSupervisor   = irList?.is_supervisor   ?? false;
    const directReports  = irList?.direct_reports  ?? [];

    const switchTab = (tab) => applyFilters({ tab, status: "", search: "", empId: "" });

    const goToPage = (page) => {
        router.get(route("ir.index"), { ...filters, page }, {
            preserveState: true, preserveScroll: true, only: ["irList", "filters"],
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({ search: searchRef.current?.value ?? "" });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Incident Reports" />

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <FileWarning className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Incident Reports</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {irList?.total ?? 0} record{irList?.total !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <Button onClick={() => router.get(route("ir.create"))} className="gap-2 self-start sm:self-auto">
                    <FilePlus className="w-4 h-4" /> Create IR
                </Button>
            </div>

            {/* Tabs — Active / History */}
            <div className="flex gap-1 border-b mb-4">
                {[
                    { key: "active",  label: "Active" },
                    { key: "history", label: "History" },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => switchTab(key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
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
                    {isSupervisor && directReports.length > 0 && (
                        <select
                            value={filters.empId}
                            onChange={(e) => applyFilters({ empId: e.target.value })}
                            className="h-9 px-3 text-sm border border-input bg-background rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer min-w-[180px]"
                        >
                            <option value="">All Employees</option>
                            {directReports.map((dr) => (
                                <option key={dr.emp_id} value={dr.emp_id}>{dr.emp_name}</option>
                            ))}
                        </select>
                    )}

                    <div className="relative">
                        <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <select
                            value={filters.status}
                            onChange={(e) => applyFilters({ status: e.target.value })}
                            className="h-9 pl-8 pr-8 text-sm border border-input bg-background rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer min-w-[180px]"
                        >
                            <option value="">All Statuses</option>
                            {(statusOptions ?? []).map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

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

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}
                            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground">
                            <X className="w-3.5 h-3.5" /> Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Active filter badge */}
            {filters.status && (
                <div className="mb-3">
                    <Badge variant="secondary" className="text-xs gap-1">
                        <SlidersHorizontal className="w-3 h-3" />
                        {filters.status}
                    </Badge>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                        <thead>
                            <tr className="bg-muted/40 border-b">
                                {["IR No.", "Date Filed", "Employee", "Code / Violation", "Remarks", "Status", "Action"].map((h) => (
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
                                        <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                                            {ir.ir_no}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                            {ir.date_created
                                                ? format(new Date(ir.date_created), "MM-dd-yyyy")
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium leading-tight">{ir.emp_name ?? ir.emp_no}</div>
                                            {ir.emp_name && (
                                                <div className="text-xs text-muted-foreground">#{ir.emp_no}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 max-w-[220px]">
                                            <CodesCell codes={ir.codes} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                                            <p className="line-clamp-2">{ir.what || "—"}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <IrStatusBadge status={ir.display_status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="outline" size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => {/* wire to view route */}}
                                            >
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
        </AuthenticatedLayout>
    );
}
