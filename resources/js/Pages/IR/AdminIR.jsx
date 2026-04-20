import { useState, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    ShieldCheck,
    Search,
    X,
    SlidersHorizontal,
    CheckCheck,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { format } from "date-fns";

import { Pagination } from "@/Components/Pagination";
import { CodesCell } from "@/Components/CodesCell";
import { useAdminFilters } from "./hooks/useAdminFilters";
import { IrStatusBadge } from "./components/IrStatusBadge";

const ROLE_LABELS = {
    hr: "HR Personnel",
    hr_mngr: "HR Manager",
};

// ── Flash banner ──────────────────────────────────────────────────────────────
function FlashBanner() {
    const { flash } = usePage().props;
    if (!flash?.success && !flash?.error) return null;
    const isSuccess = !!flash.success;
    return (
        <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 mb-4 ${
                isSuccess
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-red-300 bg-red-50 text-red-800"
            }`}
        >
            {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">
                {flash.success ?? flash.error}
            </p>
        </div>
    );
}

// ── Indeterminate checkbox ─────────────────────────────────────────────────
function IndeterminateCheckbox({ checked, indeterminate, onChange, ...props }) {
    const ref = useRef(null);
    if (ref.current) ref.current.indeterminate = indeterminate;
    return (
        <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="w-4 h-4 rounded border-gray-300 accent-primary cursor-pointer"
            {...props}
        />
    );
}

export default function AdminIR({
    irList,
    filters: initialFilters,
    adminRole,
    statusOptions,
}) {
    console.log(irList);
    const { filters, applyFilters, clearFilters, switchTab, goToPage } =
        useAdminFilters(initialFilters);
    const searchRef = useRef(null);
    const isAllTab = filters.tab === "all";
    const hasFilters =
        filters.search || filters.status || filters.start || filters.end;

    // ── Bulk selection state ────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectAllPages, setSelectAllPages] = useState(false); // true = all pages selected
    const [bulkAction, setBulkAction] = useState(""); // 'validate_valid' | 'validate_invalid' | 'approve_da'
    const [bulkRemarks, setBulkRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const currentPageIds = (irList?.data ?? []).map((ir) => ir.id);
    const allPageSelected =
        currentPageIds.length > 0 &&
        currentPageIds.every((id) => selectedIds.has(id));
    const someSelected = selectedIds.size > 0;
    const isIndeterminate = someSelected && !allPageSelected && !selectAllPages;

    // Reset selection when tab or page changes
    const handleSwitchTab = (tab) => {
        resetSelection();
        switchTab(tab);
    };
    const handleGoToPage = (page) => {
        // Keep selectAllPages state, but clear page selection
        setSelectedIds(new Set());
        goToPage(page);
    };
    const handleApplyFilters = (changed) => {
        resetSelection();
        applyFilters(changed);
    };
    const handleClearFilters = () => {
        resetSelection();
        clearFilters();
    };

    const resetSelection = () => {
        setSelectedIds(new Set());
        setSelectAllPages(false);
        setBulkAction("");
        setBulkRemarks("");
    };

    const togglePageAll = () => {
        if (selectAllPages || allPageSelected) {
            // Deselect all
            setSelectedIds(new Set());
            setSelectAllPages(false);
        } else {
            // Select current page
            setSelectedIds(new Set(currentPageIds));
            setSelectAllPages(false);
        }
    };

    const toggleRow = (id) => {
        setSelectAllPages(false); // de-activate "all pages" mode when toggling individual
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const effectiveCount = selectAllPages
        ? (irList?.total ?? 0)
        : selectedIds.size;

    // Bulk actions available per role
    const bulkActions =
        adminRole === "hr"
            ? [
                  { value: "validate_valid", label: "Mark All Valid" },
                  { value: "validate_invalid", label: "Mark All Invalid" },
              ]
            : adminRole === "hr_mngr"
              ? [{ value: "approve_da", label: "Approve All DA" }]
              : [];

    const handleBulkSubmit = () => {
        if (!bulkAction) return;
        if (bulkAction === "validate_invalid" && !bulkRemarks.trim()) return;

        setSubmitting(true);
        router.post(
            route("ir.bulkAction"),
            {
                action: bulkAction,
                ids: selectAllPages ? [] : [...selectedIds],
                select_all: selectAllPages,
                filters: selectAllPages
                    ? { search: filters.search, status: filters.status }
                    : {},
                remarks: bulkRemarks,
            },
            {
                onFinish: () => {
                    setSubmitting(false);
                    resetSelection();
                },
            },
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleApplyFilters({ search: searchRef.current?.value ?? "" });
    };

    const showBulkBar = !isAllTab && someSelected;

    return (
        <AuthenticatedLayout>
            <Head
                title={`${ROLE_LABELS[adminRole] ?? "Admin"} — Incident Reports`}
            />

            <FlashBanner />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            {ROLE_LABELS[adminRole] ?? "Admin"} — Incident
                            Reports
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {irList?.total ?? 0} record
                            {irList?.total !== 1 ? "s" : ""}
                            {isAllTab ? " total" : " needing your action"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b mb-4">
                {[
                    { key: "action", label: "Action Items" },
                    { key: "all", label: "All Records" },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => handleSwitchTab(key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            filters.tab === key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="space-y-2 mb-4">
                {/* Row 1: search + status + per-page */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex gap-2 flex-1 min-w-0"
                    >
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                key={filters.tab}
                                defaultValue={filters.search}
                                placeholder="Search IR No. or Employee No.…"
                                className="pl-8 h-9 text-sm"
                            />
                        </div>
                        <Button type="submit" size="sm" className="h-9 px-4">
                            Search
                        </Button>
                    </form>

                    <div className="flex gap-2 items-center flex-wrap">
                        {/* Status filter — available on both tabs */}
                        <div className="relative">
                            <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                            <select
                                value={filters.status ?? ""}
                                onChange={(e) =>
                                    handleApplyFilters({
                                        status: e.target.value,
                                    })
                                }
                                className="h-9 pl-8 pr-8 text-sm border border-input bg-background rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer min-w-[170px]"
                            >
                                <option value="">All Statuses</option>
                                {(statusOptions ?? []).map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            Show
                            <select
                                value={filters.perPage ?? 15}
                                onChange={(e) =>
                                    handleApplyFilters({
                                        perPage: Number(e.target.value),
                                    })
                                }
                                className="h-7 px-2 text-xs border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                {[10, 15, 25, 50].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3.5 h-3.5" /> Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Row 2: date range */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-muted-foreground shrink-0">
                        Date filed:
                    </span>
                    <Input
                        type="date"
                        value={filters.start ?? ""}
                        onChange={(e) =>
                            handleApplyFilters({ start: e.target.value })
                        }
                        className="h-8 text-xs w-36"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                        type="date"
                        value={filters.end ?? ""}
                        onChange={(e) =>
                            handleApplyFilters({ end: e.target.value })
                        }
                        className="h-8 text-xs w-36"
                        min={filters.start ?? undefined}
                    />
                </div>
            </div>

            {/* ── Bulk action bar ────────────────────────────────────────────────── */}
            {showBulkBar && (
                <div className="mb-3 rounded-lg border-2 border-primary/40 bg-primary/5 px-4 py-3 space-y-3">
                    {/* Selection info + select-all-pages option */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-primary">
                            {selectAllPages
                                ? `All ${irList?.total ?? 0} records selected`
                                : `${selectedIds.size} record${selectedIds.size !== 1 ? "s" : ""} selected on this page`}
                        </span>

                        {!selectAllPages &&
                            irList?.total > currentPageIds.length && (
                                <button
                                    type="button"
                                    className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                                    onClick={() => setSelectAllPages(true)}
                                >
                                    Select all {irList.total} records across all
                                    pages
                                </button>
                            )}

                        {selectAllPages && (
                            <button
                                type="button"
                                className="text-xs text-muted-foreground underline underline-offset-2 hover:no-underline"
                                onClick={() => {
                                    setSelectAllPages(false);
                                    setSelectedIds(new Set(currentPageIds));
                                }}
                            >
                                Clear selection
                            </button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-7 text-xs text-muted-foreground"
                            onClick={resetSelection}
                        >
                            <X className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                    </div>

                    {/* Action picker */}
                    <div className="flex flex-wrap gap-2 items-start">
                        <div className="flex gap-2 flex-wrap">
                            {bulkActions.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                        setBulkAction((prev) =>
                                            prev === value ? "" : value,
                                        )
                                    }
                                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                                        bulkAction === value
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-input bg-background hover:bg-muted"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {bulkAction && (
                            <Button
                                size="sm"
                                disabled={
                                    submitting ||
                                    (bulkAction === "validate_invalid" &&
                                        !bulkRemarks.trim())
                                }
                                onClick={handleBulkSubmit}
                                className="gap-1.5"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Apply to{" "}
                                {selectAllPages
                                    ? irList?.total
                                    : selectedIds.size}{" "}
                                record{effectiveCount !== 1 ? "s" : ""}
                            </Button>
                        )}
                    </div>

                    {/* Remarks field for invalid action */}
                    {bulkAction === "validate_invalid" && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                                Reason for marking invalid{" "}
                                <span className="text-red-500">*</span>
                            </p>
                            <Textarea
                                rows={2}
                                placeholder="Reason applied to all selected records..."
                                value={bulkRemarks}
                                onChange={(e) => setBulkRemarks(e.target.value)}
                                className="text-sm"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[760px]">
                        <thead>
                            <tr className="bg-muted/40 border-b">
                                {/* Checkbox column — only on action tab */}
                                {!isAllTab && (
                                    <th className="w-10 px-3 py-3">
                                        <IndeterminateCheckbox
                                            checked={
                                                selectAllPages ||
                                                allPageSelected
                                            }
                                            indeterminate={isIndeterminate}
                                            onChange={togglePageAll}
                                        />
                                    </th>
                                )}
                                {[
                                    "IR No.",
                                    "Date Filed",
                                    "Employee",
                                    "Code / Violation",
                                    "Status",
                                    "Action",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(irList?.data ?? []).length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={isAllTab ? 6 : 7}
                                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                                    >
                                        {isAllTab
                                            ? "No incident reports found."
                                            : "No records needing your action."}
                                    </td>
                                </tr>
                            ) : (
                                (irList?.data ?? []).map((ir) => {
                                    const isChecked =
                                        selectAllPages ||
                                        selectedIds.has(ir.id);
                                    return (
                                        <tr
                                            key={ir.id}
                                            className={`border-b last:border-0 transition-colors ${
                                                isChecked
                                                    ? "bg-primary/5"
                                                    : "hover:bg-muted/30"
                                            }`}
                                        >
                                            {!isAllTab && (
                                                <td className="w-10 px-3 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() =>
                                                            toggleRow(ir.id)
                                                        }
                                                        className="w-4 h-4 rounded border-gray-300 accent-primary cursor-pointer"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                                                {ir.ir_no}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {ir.date_created
                                                    ? format(
                                                          new Date(
                                                              ir.date_created,
                                                          ),
                                                          "MM-dd-yyyy",
                                                      )
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium leading-tight">
                                                    {ir.emp_name ??
                                                        `#${ir.emp_no}`}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    #{ir.emp_no}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 max-w-[220px]">
                                                <CodesCell codes={ir.codes} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <IrStatusBadge
                                                    status={ir.display_status}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() =>
                                                        router.get(
                                                            route(
                                                                "ir.show",
                                                                btoa(ir.id),
                                                            ),
                                                        )
                                                    }
                                                >
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                meta={{
                    current_page: irList?.current_page,
                    last_page: irList?.last_page,
                    from: irList?.from,
                    to: irList?.to,
                    total: irList?.total,
                }}
                onPageChange={handleGoToPage}
            />
        </AuthenticatedLayout>
    );
}
