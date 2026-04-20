/**
 * Renders a compact stacked list of IR code violations.
 * Used in all IR list tables (IndexIR, AdminIR, StaffIR).
 *
 * @param {{ codes: Array<{ code_no: string, violation?: string }> }} props
 */
export function CodesCell({ codes }) {
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
