import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    BookOpen, Plus, Pencil, ToggleLeft, ToggleRight,
    AlertCircle, CheckCircle2, Search, X,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/Components/ui/dialog";
import { Label } from "@/Components/ui/label";
import { Pagination } from "@/Components/Pagination";

// ── Flash banner ──────────────────────────────────────────────────────────────
function FlashBanner() {
    const { flash } = usePage().props;
    if (!flash?.success && !flash?.error) return null;
    const ok = !!flash.success;
    return (
        <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 mb-4 ${
            ok ? "border-green-300 bg-green-50 text-green-800"
               : "border-red-300 bg-red-50 text-red-800"
        }`}>
            {ok
                ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                : <AlertCircle  className="w-4 h-4 mt-0.5 shrink-0" />}
            <p className="text-sm font-medium">{flash.success ?? flash.error}</p>
        </div>
    );
}

const OFFENSE_LABELS = ["1st", "2nd", "3rd", "4th", "5th"];
const OFFENSE_KEYS   = ["first_offense", "second_offense", "third_offense", "fourth_offense", "fifth_offense"];

const BLANK_FORM = {
    code_number:    "",
    violation:      "",
    category:       "",
    root_cause:     "",
    first_offense:  "",
    second_offense: "",
    third_offense:  "",
    fourth_offense: "",
    fifth_offense:  "",
};

// ── Code form (shared by Add and Edit) ───────────────────────────────────────
function CodeForm({ values, onChange }) {
    const field = (key, label, required = false) => (
        <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <Input
                value={values[key] ?? ""}
                onChange={(e) => onChange(key, e.target.value)}
                className="h-9 text-sm"
            />
        </div>
    );

    return (
        <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
                {field("code_number", "Code Number", true)}
                {field("category", "Category")}
            </div>
            {field("violation", "Violation / Description", true)}
            {field("root_cause", "Root Cause")}
            <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                    Offense Sanctions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {OFFENSE_KEYS.map((key, i) => (
                        <div key={key} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{OFFENSE_LABELS[i]}</Label>
                            <Input
                                value={values[key] ?? ""}
                                onChange={(e) => onChange(key, e.target.value)}
                                className="h-9 text-sm"
                                placeholder="e.g. Written Warning"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CodeMaintenance({ codes, filters: initFilters }) {
    const [submitting, setSubmitting] = useState(false);

    // Filters
    const [search,  setSearch]  = useState(initFilters?.search  ?? "");
    const [status,  setStatus]  = useState(initFilters?.status  ?? "");
    const [perPage, setPerPage] = useState(initFilters?.perPage ?? 20);

    // Add dialog
    const [addOpen, setAddOpen]   = useState(false);
    const [addForm, setAddForm]   = useState(BLANK_FORM);

    // Edit dialog
    const [editTarget, setEditTarget] = useState(null); // code row
    const [editForm,   setEditForm]   = useState(BLANK_FORM);

    function applyFilters(overrides = {}) {
        router.get(route("ir.maintenance.codes"), {
            search:  search,
            status:  status,
            perPage: perPage,
            ...overrides,
            page: 1,
        }, { preserveState: true, replace: true });
    }

    function goToPage(page) {
        router.get(route("ir.maintenance.codes"), {
            search, status, perPage, page,
        }, { preserveState: true, replace: true });
    }

    function post(routeName, params, data, onDone) {
        setSubmitting(true);
        router.post(route(routeName, params), data, {
            onSuccess: () => onDone?.(),
            onFinish:  () => setSubmitting(false),
        });
    }

    function put(routeName, params, data, onDone) {
        setSubmitting(true);
        router.put(route(routeName, params), data, {
            onSuccess: () => onDone?.(),
            onFinish:  () => setSubmitting(false),
        });
    }

    const handleAdd = () => {
        post("ir.maintenance.codes.store", {}, addForm, () => {
            setAddOpen(false);
            setAddForm(BLANK_FORM);
        });
    };

    const handleEdit = () => {
        if (!editTarget) return;
        put("ir.maintenance.codes.update", editTarget.id, editForm, () => {
            setEditTarget(null);
        });
    };

    const handleToggle = (id) => {
        post("ir.maintenance.codes.toggle", id, {}, null);
    };

    const openEdit = (code) => {
        setEditTarget(code);
        setEditForm({
            code_number:    code.code_number   ?? "",
            violation:      code.violation     ?? "",
            category:       code.category      ?? "",
            root_cause:     code.root_cause    ?? "",
            first_offense:  code.first_offense  ?? "",
            second_offense: code.second_offense ?? "",
            third_offense:  code.third_offense  ?? "",
            fourth_offense: code.fourth_offense ?? "",
            fifth_offense:  code.fifth_offense  ?? "",
        });
    };

    const meta = codes?.meta ?? codes;

    return (
        <AuthenticatedLayout>
            <Head title="IR Code Numbers" />

            <FlashBanner />

            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <BookOpen className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">IR Code Numbers</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage violation codes and their corresponding offense sanctions.
                        </p>
                    </div>
                </div>
                <Button size="sm" className="gap-1.5 shrink-0" onClick={() => { setAddForm(BLANK_FORM); setAddOpen(true); }}>
                    <Plus className="w-3.5 h-3.5" /> Add Code
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyFilters({ search })}
                        placeholder="Search code or violation…"
                        className="pl-8 h-9 text-sm"
                    />
                    {search && (
                        <button
                            type="button"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => { setSearch(""); applyFilters({ search: "" }); }}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                    className="h-9 px-3 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="">All Status</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                </select>
                <Button
                    size="sm" variant="outline"
                    className="h-9"
                    onClick={() => applyFilters({ search })}
                >
                    Search
                </Button>
                <select
                    value={perPage}
                    onChange={(e) => { setPerPage(e.target.value); applyFilters({ perPage: e.target.value }); }}
                    className="h-9 px-3 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring ml-auto"
                >
                    {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr className="bg-muted/40 border-b">
                                {["Code No.", "Violation", "Category", "1st", "2nd", "3rd", "4th", "5th", "Status", "Actions"].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(codes?.data ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                        No codes found.
                                    </td>
                                </tr>
                            ) : (codes?.data ?? []).map((c) => (
                                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">{c.code_number}</td>
                                    <td className="px-4 py-3 text-sm max-w-[200px]">
                                        <span className="line-clamp-2">{c.violation}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {c.category || <span className="italic">—</span>}
                                    </td>
                                    {OFFENSE_KEYS.map((key) => (
                                        <td key={key} className="px-4 py-3 text-xs text-muted-foreground max-w-[100px]">
                                            <span className="line-clamp-1">{c[key] || <span className="italic">—</span>}</span>
                                        </td>
                                    ))}
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            c.status
                                                ? "bg-green-100 text-green-700"
                                                : "bg-muted text-muted-foreground"
                                        }`}>
                                            {c.status ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline" size="sm"
                                                className="h-7 text-xs gap-1"
                                                onClick={() => openEdit(c)}
                                            >
                                                <Pencil className="w-3 h-3" /> Edit
                                            </Button>
                                            <Button
                                                variant="outline" size="sm"
                                                className="h-7 text-xs gap-1"
                                                disabled={submitting}
                                                onClick={() => handleToggle(c.id)}
                                            >
                                                {c.status
                                                    ? <><ToggleRight className="w-3.5 h-3.5 text-green-600" /> Deactivate</>
                                                    : <><ToggleLeft  className="w-3.5 h-3.5" /> Activate</>}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                meta={codes}
                onPageChange={goToPage}
            />

            {/* ── Add Dialog ──────────────────────────────────────────────────── */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Code Number</DialogTitle>
                    </DialogHeader>
                    <CodeForm
                        values={addForm}
                        onChange={(key, val) => setAddForm((f) => ({ ...f, [key]: val }))}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button
                            disabled={submitting || !addForm.code_number || !addForm.violation}
                            onClick={handleAdd}
                        >
                            Add Code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Edit Dialog ─────────────────────────────────────────────────── */}
            <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Code — {editTarget?.code_number}</DialogTitle>
                    </DialogHeader>
                    <CodeForm
                        values={editForm}
                        onChange={(key, val) => setEditForm((f) => ({ ...f, [key]: val }))}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                        <Button
                            disabled={submitting || !editForm.code_number || !editForm.violation}
                            onClick={handleEdit}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
