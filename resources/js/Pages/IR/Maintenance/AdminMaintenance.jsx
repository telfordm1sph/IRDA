import { useState, useRef, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    ShieldCheck, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
    AlertCircle, CheckCircle2, Search, X, UserCog,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/Components/ui/dialog";
import { Label } from "@/Components/ui/label";

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

const ROLE_LABELS = { hr: "HR Personnel", hr_mngr: "HR Manager" };

// ── Employee search autocomplete ─────────────────────────────────────────────
function EmpSearch({ value, onSelect }) {
    const [query, setQuery]     = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen]       = useState(false);
    const timer = useRef(null);

    useEffect(() => {
        if (query.length < 2) { setResults([]); setOpen(false); return; }
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const r = await fetch(route("ir.searchEmployees") + `?q=${encodeURIComponent(query)}&per_page=10`);
                const j = await r.json();
                setResults(j.data ?? []);
                setOpen(true);
            } catch { /* ignore */ }
            setLoading(false);
        }, 300);
    }, [query]);

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                    value={value ? `#${value}` : query}
                    onChange={(e) => { setQuery(e.target.value); if (value) onSelect(null, ""); }}
                    placeholder="Type emp no. or name…"
                    className="pl-8 h-9 text-sm"
                />
                {(query || value) && (
                    <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => { setQuery(""); onSelect(null, ""); setOpen(false); }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            {open && results.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto">
                    {results.map((e) => (
                        <li
                            key={e.emp_id}
                            className="px-3 py-2 cursor-pointer hover:bg-muted/60 text-sm"
                            onMouseDown={() => {
                                onSelect(e.emp_id, e.emp_name);
                                setQuery("");
                                setOpen(false);
                            }}
                        >
                            <span className="font-mono text-xs text-muted-foreground mr-2">#{e.emp_id}</span>
                            {e.emp_name}
                        </li>
                    ))}
                </ul>
            )}
            {loading && (
                <p className="absolute mt-1 text-xs text-muted-foreground">Searching…</p>
            )}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminMaintenance({ admins, roles }) {
    const [submitting, setSubmitting] = useState(false);

    // Add dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addEmpNo, setAddEmpNo]   = useState(null);
    const [addEmpName, setAddEmpName] = useState("");
    const [addRole, setAddRole]     = useState("hr");

    // Edit dialog
    const [editTarget, setEditTarget] = useState(null); // {id, role}
    const [editRole, setEditRole]     = useState("hr");

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState(null); // {id, emp_name}

    function post(routeName, params, data, onDone) {
        setSubmitting(true);
        router.post(route(routeName, params), data, {
            onSuccess: () => { onDone?.(); },
            onFinish:  () => setSubmitting(false),
        });
    }

    function put(routeName, params, data, onDone) {
        setSubmitting(true);
        router.put(route(routeName, params), data, {
            onSuccess: () => { onDone?.(); },
            onFinish:  () => setSubmitting(false),
        });
    }

    const handleAdd = () => {
        if (!addEmpNo) return;
        post("ir.maintenance.admins.store", {}, { emp_no: addEmpNo, role: addRole }, () => {
            setAddOpen(false);
            setAddEmpNo(null); setAddEmpName(""); setAddRole("hr");
        });
    };

    const handleEdit = () => {
        if (!editTarget) return;
        put("ir.maintenance.admins.update", editTarget.id, { role: editRole }, () => {
            setEditTarget(null);
        });
    };

    const handleToggle = (id) => {
        post("ir.maintenance.admins.toggle", id, {}, null);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(route("ir.maintenance.admins.delete", deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="IR Admin Management" />

            <FlashBanner />

            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <UserCog className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">IR Admin Management</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage employees with HR / HR Manager access to the IR system.
                        </p>
                    </div>
                </div>
                <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setAddOpen(true)}>
                    <Plus className="w-3.5 h-3.5" /> Add Admin
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[580px]">
                        <thead>
                            <tr className="bg-muted/40 border-b">
                                {["Emp No.", "Employee Name", "Role", "Status", "Actions"].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(admins ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                        No IR admins configured.
                                    </td>
                                </tr>
                            ) : (admins ?? []).map((a) => (
                                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs font-semibold">#{a.emp_no}</td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {a.emp_name ?? <span className="text-muted-foreground italic">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                            {ROLE_LABELS[a.role] ?? a.role}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            a.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-muted text-muted-foreground"
                                        }`}>
                                            {a.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline" size="sm"
                                                className="h-7 text-xs gap-1"
                                                onClick={() => { setEditTarget(a); setEditRole(a.role); }}
                                            >
                                                <Pencil className="w-3 h-3" /> Edit
                                            </Button>
                                            <Button
                                                variant="outline" size="sm"
                                                className="h-7 text-xs gap-1"
                                                disabled={submitting}
                                                onClick={() => handleToggle(a.id)}
                                            >
                                                {a.is_active
                                                    ? <><ToggleRight className="w-3.5 h-3.5 text-green-600" /> Deactivate</>
                                                    : <><ToggleLeft  className="w-3.5 h-3.5" /> Activate</>}
                                            </Button>
                                            <Button
                                                variant="outline" size="sm"
                                                className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                onClick={() => setDeleteTarget(a)}
                                            >
                                                <Trash2 className="w-3 h-3" /> Remove
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Add Dialog ──────────────────────────────────────────────────── */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add IR Admin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Employee</Label>
                            <EmpSearch
                                value={addEmpNo}
                                onSelect={(id, name) => { setAddEmpNo(id); setAddEmpName(name); }}
                            />
                            {addEmpName && (
                                <p className="text-xs text-muted-foreground mt-1">Selected: <span className="font-medium text-foreground">{addEmpName}</span></p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Role</Label>
                            <select
                                value={addRole}
                                onChange={(e) => setAddRole(e.target.value)}
                                className="w-full h-9 px-3 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                {Object.entries(roles ?? {}).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button disabled={submitting || !addEmpNo} onClick={handleAdd}>Add Admin</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Edit Dialog ─────────────────────────────────────────────────── */}
            <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Admin Role</DialogTitle>
                    </DialogHeader>
                    {editTarget && (
                        <div className="space-y-4 py-2">
                            <p className="text-sm text-muted-foreground">
                                Updating role for{" "}
                                <span className="font-medium text-foreground">
                                    {editTarget.emp_name ?? `#${editTarget.emp_no}`}
                                </span>
                            </p>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Role</Label>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full h-9 px-3 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    {Object.entries(roles ?? {}).map(([v, l]) => (
                                        <option key={v} value={v}>{l}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                        <Button disabled={submitting} onClick={handleEdit}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm Dialog ───────────────────────────────────────── */}
            <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Admin</DialogTitle>
                    </DialogHeader>
                    {deleteTarget && (
                        <p className="text-sm text-muted-foreground py-2">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-foreground">
                                {deleteTarget.emp_name ?? `#${deleteTarget.emp_no}`}
                            </span>{" "}
                            from IR admins? This cannot be undone.
                        </p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
