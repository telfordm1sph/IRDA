import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeft, FileWarning, Send } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { toast } from "sonner";

import { useCodeNumbers }         from "./hooks/useCodeNumbers";
import { IncidentDetailsSection } from "./components/IncidentDetailsSection";
import { ViolationSection }       from "./components/ViolationSection";
import { CodeNumberModal }        from "./components/CodeNumberModal";
import { EMPTY_ITEM }             from "./components/IrConstants";
import { SectionCard }            from "./components/IrShared";
import { User }                   from "lucide-react";
import { safeFormat }             from "@/utils/dateFormat";

// ── Read-only employee info ───────────────────────────────────────────────────
function EmpInfo({ ir }) {
    const fields = [
        ["Employee No.", ir.emp_no],
        ["Employee Name", ir.emp_name],
        ["Department", ir.department],
        ["Position", ir.position],
        ["Station", ir.station],
    ];
    return (
        <SectionCard icon={User} title="I. Details of Person Involved (read-only)">
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                {fields.map(([label, val]) => (
                    <div key={label}>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-sm font-medium">{val || "—"}</p>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}

export default function EditIR({ ir, hash, daTypes }) {
    // Pre-fill from existing IR data
    const initialItems = (ir.violations ?? []).map(v => ({
        code_no:        v.code_no        ?? "",
        violation:      v.violation      ?? "",
        da_type:        v.da_type        ?? 1,
        date_committed: v.date_committed
            ? String(v.date_committed).split("+").map(d => d.trim()).filter(Boolean)
            : [""],
        offense_no: v.offense_no ?? "",
    }));

    const { data, setData, post, processing, errors } = useForm({
        reference:  ir.reference  ?? "",
        what:       ir.what       ?? "",
        when_date:  ir.when_date  ?? "",
        where_loc:  ir.where_loc  ?? "",
        how:        ir.how        ?? "",
        items:      initialItems.length ? initialItems : [{ ...EMPTY_ITEM }],
    });

    // ── Item management (mirrors useIrForm) ────────────────────────────────
    const addItem = () =>
        setData("items", [...data.items, { ...EMPTY_ITEM }]);

    const removeItem = (i) => {
        if (data.items.length === 1) return;
        setData("items", data.items.filter((_, idx) => idx !== i));
    };

    const updateItem = (i, field, value, codeNumbers = []) =>
        setData("items", data.items.map((item, idx) => {
            if (idx !== i) return item;
            const next = { ...item, [field]: value };
            if (field === "code_no") {
                const code = codeNumbers.find(c => c.code_number === value);
                if (code) next.violation = code.violation ?? "";
            }
            return next;
        }));

    const addDate = (itemIdx) =>
        setData("items", data.items.map((item, idx) =>
            idx !== itemIdx ? item
                : { ...item, date_committed: [...(item.date_committed ?? [""]), ""] }
        ));

    const removeDate = (itemIdx, dateIdx) =>
        setData("items", data.items.map((item, idx) =>
            idx !== itemIdx ? item
                : { ...item, date_committed: item.date_committed.filter((_, di) => di !== dateIdx) }
        ));

    const updateDate = (itemIdx, dateIdx, value) =>
        setData("items", data.items.map((item, idx) =>
            idx !== itemIdx ? item
                : { ...item, date_committed: item.date_committed.map((d, di) => di === dateIdx ? value : d) }
        ));

    // ── Code number modal ──────────────────────────────────────────────────
    const {
        codeNumbers, codeLoading, codePage, codeTotalPages,
        codeModalOpen, selectedItemIndex,
        fetchCodeNumbers, loadCodeOptions, openModal, closeModal,
    } = useCodeNumbers();

    const handleSelectCode = (codeNo) => {
        const code = codeNumbers.find(c => c.code_number === codeNo);
        if (code && selectedItemIndex !== null) {
            updateItem(selectedItemIndex, "code_no", code.code_number, codeNumbers);
            closeModal();
        }
    };

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("ir.resubmit", hash), {
            onSuccess: () => toast.success("IR updated and resubmitted for HR validation."),
            onError:   () => toast.error("Please fix the highlighted errors before submitting."),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit IR — ${ir.ir_no}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 shrink-0 mt-0.5">
                        <FileWarning className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Edit & Resubmit IR
                            <span className="ml-2 font-mono text-muted-foreground text-base">{ir.ir_no}</span>
                        </h1>
                        <p className="text-sm text-amber-700 mt-0.5">
                            This IR was marked invalid by HR. Update the details and resubmit for re-validation.
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto"
                    onClick={() => router.get(route("ir.show", hash))}>
                    <ArrowLeft className="w-3.5 h-3.5" /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 w-full">
                {/* Employee info — read-only */}
                <EmpInfo ir={ir} />

                <IncidentDetailsSection
                    data={data}
                    setData={setData}
                    errors={errors}
                />

                <ViolationSection
                    data={data}
                    setData={setData}
                    errors={errors}
                    updateItem={(idx, field, value) => updateItem(idx, field, value, codeNumbers)}
                    addItem={addItem}
                    removeItem={removeItem}
                    addDate={addDate}
                    removeDate={removeDate}
                    updateDate={updateDate}
                    loadCodeOptions={loadCodeOptions}
                    openModal={openModal}
                />

                {/* Submit */}
                <div className="flex justify-end gap-3 pb-8">
                    <Button type="button" variant="outline"
                        onClick={() => router.get(route("ir.show", hash))}
                        disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={processing} className="min-w-[140px] gap-2">
                        {processing ? (
                            <>
                                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Submitting…
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Resubmit IR
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <CodeNumberModal
                open={codeModalOpen}
                onOpenChange={(open) => { if (!open) closeModal(); }}
                selectedItemIndex={selectedItemIndex}
                codeNumbers={codeNumbers}
                codeLoading={codeLoading}
                codePage={codePage}
                codeTotalPages={codeTotalPages}
                onSelect={handleSelectCode}
                onLoadMore={() => fetchCodeNumbers(codePage + 1)}
            />
        </AuthenticatedLayout>
    );
}
