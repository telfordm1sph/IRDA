import { useRef, useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    FileWarning,
    ArrowLeft,
    User,
    FileText,
    ClipboardList,
    ShieldCheck,
    MessageSquare,
    FileCheck,
    Printer,
    AlertCircle,
    CheckCircle2,
    Clock3,
    CalendarDays,
    Pencil,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Textarea } from "@/Components/ui/textarea";
import { SectionCard, OffenseBadge } from "./components/IrShared";
import { IrStatusBadge } from "./components/IrStatusBadge";
import { PrintableDA } from "./components/PrintableDA";
import { safeFormat, safeFormatDT, formatMultiDates } from "@/utils/dateFormat";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Skeleton } from "@/Components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Read-only field ───────────────────────────────────────────────────────────
export function ReadField({ label, value, mono = false }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p
                className={[
                    "text-sm",
                    mono ? "font-mono" : "font-medium",
                    !value ? "text-muted-foreground" : "text-foreground",
                ].join(" ")}
            >
                {value || "—"}
            </p>
        </div>
    );
}

export function TextBlock({ label, value }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm min-h-[56px] whitespace-pre-wrap text-foreground">
                {value || (
                    <span className="text-muted-foreground">No data available</span>
                )}
            </div>
        </div>
    );
}

// ── Modern signature block ─────────────────────────────────────────────────────
export function SignatureBlock({ role, name, date, actionLabel = "Signed" }) {
    const signed = !!date;
    return (
        <div
            className={cn(
                "rounded-xl border overflow-hidden flex flex-col transition-colors",
                signed
                    ? "bg-green-50/50 border-green-200/70 dark:bg-green-900/10 dark:border-green-800/40"
                    : "bg-muted/20 border-border/60",
            )}
        >
            {/* top accent bar */}
            <div className={cn("h-1 w-full shrink-0", signed ? "bg-green-500" : "bg-border/60")} />

            <div className="p-3 flex flex-col gap-2 flex-1">
                {/* role label (2-line max) + status pill */}
                <div className="flex items-start justify-between gap-1 min-h-[2.5rem]">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight line-clamp-2 flex-1">
                        {role}
                    </span>
                    <span
                        className={cn(
                            "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5",
                            signed
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-muted text-muted-foreground",
                        )}
                    >
                        {signed ? (
                            <><CheckCircle2 className="w-2.5 h-2.5" /> {actionLabel}</>
                        ) : (
                            <><Clock3 className="w-2.5 h-2.5" /> Pending</>
                        )}
                    </span>
                </div>

                {/* name — fixed height so date always aligns */}
                <div className="h-[2.75rem] flex items-start overflow-hidden">
                    {name ? (
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 w-full">
                            {name}
                        </p>
                    ) : (
                        <span className="text-sm text-muted-foreground italic">—</span>
                    )}
                </div>

                {/* date — mt-auto pins to bottom regardless of content above */}
                <div className="mt-auto flex items-center gap-1.5 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                    <CalendarDays className="w-3 h-3 shrink-0" />
                    <span className="leading-tight">{date || "—"}</span>
                </div>
            </div>
        </div>
    );
}

// ── Action panel wrapper ───────────────────────────────────────────────────────
export function ActionPanel({ title, children }) {
    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base text-primary">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    );
}

// ── Lazy section — renders placeholder until scrolled into view ────────────────
function LazySection({ children }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    io.disconnect();
                }
            },
            { rootMargin: "300px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={ref}>
            {visible ? (
                children
            ) : (
                <div className="h-28 rounded-xl border bg-muted/20 animate-pulse" />
            )}
        </div>
    );
}

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
            <p className="text-sm font-medium">{flash.success ?? flash.error}</p>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ShowIR({
    ir,
    currentUserRole,
    currentEmpId,
    hash,
    isRequestor,
    availableActions = {},
}) {
    const {
        hrCanValidate,
        requestorCanEdit,
        empCanSubmitLoe,
        svCanAssess,
        hrCanRevalidate,
        dhCanReview,
        hrCanIssueDa,
        // DA-phase actions — these are handled in ShowDA
        hrMngrCanApproveDa,
        svCanAckDa,
        dhCanAckDa,
        empCanAckDa,
    } = availableActions;

    const hasLoe = ir.reasons?.length > 0;
    const isIrOnly = ir.company_id === 5;
    const inDaPhase = !isIrOnly && ir.ir_status === 2 && !!ir.da_request;
    const daAcknowledged = !!ir.da_request?.acknowledge_da;
    const byRole = Object.fromEntries((ir.approvals ?? []).map((a) => [a.role, a]));
    const hrApproval = byRole["hr"];
    const svApproval = byRole["sv"];
    const dhApproval = byRole["dh"];

    // Any DA-phase action is pending for this user → redirect them to ShowDA
    const hasDaAction =
        hrMngrCanApproveDa || svCanAckDa || dhCanAckDa || empCanAckDa;

    // IR-phase actions still handled here
    const hasIrAction =
        hrCanValidate ||
        requestorCanEdit ||
        empCanSubmitLoe ||
        svCanAssess ||
        hrCanRevalidate ||
        dhCanReview ||
        hrCanIssueDa;

    // ── Local form state ───────────────────────────────────────────────────────
    const [submitting, setSubmitting] = useState(false);
    const [validateApproved, setValidateApproved] = useState(true);
    const [validateRemarks, setValidateRemarks] = useState("");
    const MAX_REASONS = 5;
    const [loeReasons, setLoeReasons] = useState(Array(MAX_REASONS).fill(""));
    const [assessment, setAssessment] = useState("");
    const [recommendation, setRecommendation] = useState("");
    const [loeCertified, setLoeCertified] = useState(false);
    const [revalidateProceed, setRevalidateProceed] = useState(true);
    const [revalidateRemarks, setRevalidateRemarks] = useState("");

    function post(routeName, data) {
        setSubmitting(true);
        router.post(route(routeName, hash), data, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`IR ${ir.ir_no}`} />

            {/* Hidden printable DA */}
            {inDaPhase && daAcknowledged && <PrintableDA ir={ir} />}

            <FlashBanner />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 print:hidden">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <FileWarning className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold tracking-tight font-mono">
                                {ir.ir_no}
                            </h1>
                            <IrStatusBadge status={ir.display_status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Filed {safeFormat(ir.date_created, "MMMM d, yyyy")}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                    {inDaPhase && daAcknowledged && currentUserRole === "hr" && (
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => window.print()}
                        >
                            <Printer className="w-3.5 h-3.5" /> Print DA
                        </Button>
                    )}
                    {inDaPhase && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => router.get(route("ir.show.da", hash))}
                        >
                            <FileCheck className="w-3.5 h-3.5" /> View DA
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => router.get(route("ir.index"))}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Button>
                </div>
            </div>

            <div className="space-y-4 print:hidden">
                {/* DA-phase action notice — redirect user to ShowDA */}
                {hasDaAction && (
                    <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-700/40">
                        <CardContent className="flex items-center justify-between gap-4 py-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                                        Action required on the Disciplinary Action
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                        Review the DA form and complete your acknowledgement there.
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="gap-1.5 shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={() => router.get(route("ir.show.da", hash))}
                            >
                                Open DA <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* IR-only company notice — shown when IR is approved but no DA applies */}
                {isIrOnly && ir.ir_status === 2 && (
                    <Card className="border-green-300/60 bg-green-50/50 dark:bg-green-900/10 dark:border-green-700/40">
                        <CardContent className="flex items-start gap-3 py-4">
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-green-900 dark:text-green-300">
                                    IR Approved — No Disciplinary Action Required
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                                    This employee belongs to{" "}
                                    {ir.company ? (
                                        <span className="font-medium">{ir.company}</span>
                                    ) : (
                                        "a company"
                                    )}{" "}
                                    whose IR process ends at approval. No DA will be issued.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* I. Employee Details */}
                <SectionCard icon={User} title="I. Details of Person Involved">
                    <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                        <ReadField label="Employee No." value={ir.emp_no} mono />
                        <ReadField
                            label="Shift / Team"
                            value={
                                [ir.shift, ir.team].filter(Boolean).join(" / ") ||
                                null
                            }
                        />
                        <ReadField label="Employee Name" value={ir.emp_name} />
                        <ReadField label="Station" value={ir.station} />
                        <ReadField label="Position" value={ir.position} />
                        <ReadField label="Department" value={ir.department} />
                        <ReadField label="Product Line" value={ir.prodline} />
                    </div>
                </SectionCard>

                {/* II. Violation Type */}
                <SectionCard icon={FileText} title="II. Violation Type">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex gap-4">
                            {[
                                { value: 0, label: "Administrative" },
                                { value: 1, label: "Quality" },
                            ].map(({ value, label }) => (
                                <label
                                    key={value}
                                    className="flex items-center gap-2 cursor-default"
                                >
                                    <input
                                        type="radio"
                                        readOnly
                                        checked={ir.quality_violation === value}
                                        onChange={() => {}}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm">{label}</span>
                                </label>
                            ))}
                        </div>
                        {ir.reference && (
                            <div className="sm:ml-6">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                    Reference (IPNR / QDN / EQS)
                                </p>
                                <p className="text-sm font-medium">{ir.reference}</p>
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* III. Statement of Facts */}
                <SectionCard
                    icon={ClipboardList}
                    title="III. Statement of Facts / Incident Details"
                >
                    <div className="space-y-4">
                        <TextBlock label="What happened" value={ir.what} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ReadField
                                label="When (Date)"
                                value={safeFormat(ir.when_date, "MMMM d, yyyy")}
                            />
                            <ReadField
                                label="Where (Location)"
                                value={ir.where_loc}
                            />
                        </div>
                        <TextBlock label="How / Other information" value={ir.how} />
                    </div>
                </SectionCard>

                {/* IV. Code Violations */}
                <LazySection>
                    <SectionCard icon={ShieldCheck} title="IV. Code Violations">
                        <div className="rounded-lg border overflow-x-auto">
                            <table className="w-full text-sm min-w-[560px]">
                                <thead>
                                    <tr className="bg-muted/40 border-b">
                                        {[
                                            "Code No.",
                                            "Violation / Nature of Offense",
                                            "D.A. Type",
                                            "Date Committed",
                                            "Offense No.",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(ir.violations ?? []).map((v, i) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold">
                                                {v.code_no}
                                            </td>
                                            <td className="px-4 py-3 text-sm max-w-[240px]">
                                                {v.violation}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <OffenseBadge value={v.da_type} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {formatMultiDates(v.date_committed)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {v.offense_no ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-xs"
                                                    >
                                                        {v.offense_no}
                                                    </Badge>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {!ir.violations?.length && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-8 text-center text-sm text-muted-foreground"
                                            >
                                                No violations recorded.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </LazySection>

                {/* V. Letter of Explanation */}
                {(hasLoe || ir.ir_status >= 1) && (
                    <LazySection>
                        <SectionCard
                            icon={MessageSquare}
                            title="V. Letter of Explanation"
                        >
                            {hasLoe ? (
                                <div className="space-y-3">
                                    {ir.reasons.map((r) => (
                                        <div
                                            key={r.seq}
                                            className="rounded-md border bg-muted/30 px-4 py-3"
                                        >
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                                Reason {r.seq}
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">
                                                {r.reason_text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    No letter of explanation submitted yet.
                                </p>
                            )}
                        </SectionCard>
                    </LazySection>
                )}

                {/* VI. Assessment & Recommendation */}
                {(ir.assessment || ir.recommendation) && (
                    <LazySection>
                        <SectionCard
                            icon={ClipboardList}
                            title="VI. Assessment &amp; Recommendation"
                        >
                            <div className="space-y-4">
                                {ir.assessment && (
                                    <TextBlock
                                        label="Admin Hearing / Counseling"
                                        value={ir.assessment}
                                    />
                                )}
                                {ir.recommendation && (
                                    <TextBlock
                                        label="Recommendation"
                                        value={ir.recommendation}
                                    />
                                )}
                            </div>
                        </SectionCard>
                    </LazySection>
                )}

                {/* VII. IR Approval Signatures */}
                <LazySection>
                    <SectionCard
                        icon={ShieldCheck}
                        title="VII. Approval Signatures"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <SignatureBlock
                                role="Reported by"
                                name={ir.requestor_name}
                                date={safeFormatDT(ir.date_created)}
                                actionLabel="Filed"
                            />
                            <SignatureBlock
                                role="HR Personnel"
                                name={hrApproval?.approver_name}
                                date={safeFormatDT(hrApproval?.sign_date)}
                                actionLabel="Validated"
                            />
                            <SignatureBlock
                                role="Approver 1 (Supervisor)"
                                name={svApproval?.approver_name}
                                date={safeFormatDT(svApproval?.sign_date)}
                                actionLabel="Assessed"
                            />
                            <SignatureBlock
                                role="Approver 2 (Dept Head)"
                                name={dhApproval?.approver_name}
                                date={safeFormatDT(dhApproval?.sign_date)}
                                actionLabel="Approved"
                            />
                        </div>
                        {hrApproval?.da_sign_date && (
                            <p className="mt-4 text-xs text-muted-foreground">
                                HR re-validated on {safeFormatDT(hrApproval.da_sign_date)}
                            </p>
                        )}
                    </SectionCard>
                </LazySection>

                {/* VIII. Action Required — IR-phase only ───────────────────── */}
                {(hasIrAction) && (
                    <LazySection>
                        <SectionCard
                            icon={AlertCircle}
                            title="VIII. Action Required"
                        >
                            {/* ── HR: Validate IR ── */}
                            {hrCanValidate && (
                                <ActionPanel title="Validate Incident Report">
                                    <p className="text-sm text-muted-foreground">
                                        Review the IR and mark it as Valid or Invalid.
                                        Invalid IRs are returned to the requestor for
                                        correction.
                                    </p>
                                    <div className="flex gap-6">
                                        {[
                                            { v: true, label: "Valid" },
                                            { v: false, label: "Invalid" },
                                        ].map(({ v, label }) => (
                                            <label
                                                key={label}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    checked={validateApproved === v}
                                                    onChange={() =>
                                                        setValidateApproved(v)
                                                    }
                                                    className="accent-primary"
                                                />
                                                <span className="text-sm font-medium">
                                                    {label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                                            Remarks{" "}
                                            {!validateApproved && (
                                                <span className="text-red-500">*</span>
                                            )}
                                        </p>
                                        <Textarea
                                            rows={3}
                                            placeholder={
                                                validateApproved
                                                    ? "Optional remarks..."
                                                    : "Reason for marking invalid (required)"
                                            }
                                            value={validateRemarks}
                                            onChange={(e) =>
                                                setValidateRemarks(e.target.value)
                                            }
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={
                                                submitting ||
                                                (!validateApproved &&
                                                    !validateRemarks.trim())
                                            }
                                            onClick={() =>
                                                post("ir.validate", {
                                                    approved: validateApproved,
                                                    remarks: validateRemarks,
                                                })
                                            }
                                        >
                                            {validateApproved
                                                ? "Mark as Valid"
                                                : "Mark as Invalid"}
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}

                            {/* ── Requestor: Edit IR after invalid ── */}
                            {requestorCanEdit && (
                                <ActionPanel title="IR Marked Invalid — Revision Required">
                                    <p className="text-sm text-muted-foreground">
                                        HR has marked this IR as invalid.
                                        {hrApproval?.remarks && (
                                            <span className="block mt-1 italic text-amber-700">
                                                HR remarks: "{hrApproval.remarks}"
                                            </span>
                                        )}
                                        Please review and correct the IR then resubmit.
                                    </p>
                                    <div className="flex justify-end">
                                        <Button
                                            className="gap-1.5"
                                            onClick={() =>
                                                router.get(route("ir.edit", hash))
                                            }
                                        >
                                            <Pencil className="w-3.5 h-3.5" /> Edit &
                                            Resubmit
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}

                            {/* ── Employee: Submit LOE ── */}
                            {empCanSubmitLoe && (
                                <ActionPanel title="Submit Letter of Explanation">
                                    <p className="text-sm text-muted-foreground">
                                        Explain your side for each point. Provide exactly
                                        5 reasons.
                                    </p>
                                    <div className="space-y-3">
                                        {loeReasons.map((reason, i) => (
                                            <div key={i} className="space-y-1">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                    Reason {i + 1}
                                                </p>
                                                <Textarea
                                                    rows={4}
                                                    placeholder="Write your explanation here..."
                                                    value={reason}
                                                    onChange={(e) =>
                                                        setLoeReasons((prev) =>
                                                            prev.map((r, idx) =>
                                                                idx === i
                                                                    ? e.target.value
                                                                    : r,
                                                            ),
                                                        )
                                                    }
                                                    className={`text-sm ${
                                                        !reason.trim()
                                                            ? "border-red-300"
                                                            : ""
                                                    }`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {/* Certification checkbox */}
                                    <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border/60 bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={loeCertified}
                                            onChange={(e) =>
                                                setLoeCertified(e.target.checked)
                                            }
                                            className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                                        />
                                        <span className="text-sm text-foreground leading-snug">
                                            I hereby certify that the above information is{" "}
                                            <span className="font-semibold">
                                                true and correct
                                            </span>
                                            .
                                        </span>
                                    </label>

                                    <div className="flex justify-end">
                                        <Button
                                            disabled={
                                                submitting ||
                                                loeReasons.some((r) => !r.trim()) ||
                                                !loeCertified
                                            }
                                            onClick={() =>
                                                post("ir.submitLoe", {
                                                    reasons: loeReasons,
                                                })
                                            }
                                        >
                                            Submit LOE
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}

                            {/* ── Supervisor: Assessment ── */}
                            {svCanAssess && (
                                <ActionPanel title="Submit Supervisor Assessment">
                                    <p className="text-sm text-muted-foreground">
                                        Provide your assessment and recommendation after
                                        reviewing the LOE.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                                                Assessment / Counseling Notes{" "}
                                                <span className="text-red-500">*</span>
                                            </p>
                                            <Textarea
                                                rows={5}
                                                placeholder="Describe the admin hearing / counseling conducted..."
                                                value={assessment}
                                                onChange={(e) =>
                                                    setAssessment(e.target.value)
                                                }
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                                                Recommendation{" "}
                                                <span className="text-red-500">*</span>
                                            </p>
                                            <Textarea
                                                rows={4}
                                                placeholder="Enter your recommendation (e.g. suspension, warning, dismissal, etc.)"
                                                value={recommendation}
                                                onChange={(e) =>
                                                    setRecommendation(e.target.value)
                                                }
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={
                                                submitting ||
                                                !assessment.trim() ||
                                                !recommendation.trim()
                                            }
                                            onClick={() =>
                                                post("ir.assess", {
                                                    assessment,
                                                    recommendation,
                                                })
                                            }
                                        >
                                            Submit Assessment
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}

                            {/* ── HR: Re-validate after SV assessment ── */}
                            {hrCanRevalidate && (
                                <ActionPanel title="HR Re-validation">
                                    <p className="text-sm text-muted-foreground">
                                        Supervisor has submitted their assessment. Review
                                        and decide whether to proceed.
                                    </p>
                                    <div className="flex gap-6">
                                        {[
                                            { v: true, label: "Proceed to Dept Approval" },
                                            { v: false, label: "Mark as Invalid" },
                                        ].map(({ v, label }) => (
                                            <label
                                                key={label}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    checked={revalidateProceed === v}
                                                    onChange={() =>
                                                        setRevalidateProceed(v)
                                                    }
                                                    className="accent-primary"
                                                />
                                                <span className="text-sm font-medium">
                                                    {label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {!revalidateProceed && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                                                Reason{" "}
                                                <span className="text-red-500">*</span>
                                            </p>
                                            <Textarea
                                                rows={3}
                                                placeholder="State the reason for marking as invalid..."
                                                value={revalidateRemarks}
                                                onChange={(e) =>
                                                    setRevalidateRemarks(e.target.value)
                                                }
                                                className="text-sm"
                                            />
                                        </div>
                                    )}
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={
                                                submitting ||
                                                (!revalidateProceed &&
                                                    !revalidateRemarks.trim())
                                            }
                                            onClick={() =>
                                                post("ir.revalidate", {
                                                    proceed: revalidateProceed,
                                                    remarks: revalidateRemarks,
                                                })
                                            }
                                        >
                                            {revalidateProceed
                                                ? "Proceed"
                                                : "Mark as Invalid"}
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}

                            {/* ── Dept Head: Review ── */}
                            {dhCanReview && (
                                <ActionPanel title="Department Head Review">
                                    <p className="text-sm text-muted-foreground">
                                        Approve or disapprove the IR to proceed to DA
                                        phase.
                                    </p>
                                    <div className="flex gap-6">
                                        {[
                                            { v: true, label: "Approve" },
                                            { v: false, label: "Disapprove" },
                                        ].map(({ v, label }) => (
                                            <label
                                                key={label}
                                                className="flex items-center gap-2"
                                            >
                                                <input
                                                    type="radio"
                                                    checked={revalidateProceed === v}
                                                    onChange={() =>
                                                        setRevalidateProceed(v)
                                                    }
                                                    className="accent-primary"
                                                />
                                                <span className="text-sm font-medium">
                                                    {label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {!revalidateProceed && (
                                        <div className="mt-3">
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                                                Remarks{" "}
                                                <span className="text-red-500">*</span>
                                            </p>
                                            <Textarea
                                                rows={3}
                                                placeholder="Reason for disapproval..."
                                                value={revalidateRemarks}
                                                onChange={(e) =>
                                                    setRevalidateRemarks(e.target.value)
                                                }
                                                className="text-sm"
                                            />
                                        </div>
                                    )}
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={
                                                submitting ||
                                                (!revalidateProceed &&
                                                    !revalidateRemarks.trim())
                                            }
                                            onClick={() =>
                                                post("ir.deptReview", {
                                                    approved: revalidateProceed,
                                                    remarks: revalidateRemarks,
                                                })
                                            }
                                        >
                                            Submit Decision
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}

                            {/* ── HR: Issue DA ── */}
                            {hrCanIssueDa && (
                                <ActionPanel title="Issue Disciplinary Action">
                                    <p className="text-sm text-muted-foreground">
                                        The IR has been approved. Issue a Disciplinary
                                        Action to proceed with the DA signing workflow.
                                    </p>
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={submitting}
                                            onClick={() => post("ir.issueDa", {})}
                                        >
                                            Issue DA
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}
                        </SectionCard>
                    </LazySection>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
