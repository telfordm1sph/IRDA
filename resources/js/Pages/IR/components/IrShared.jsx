import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import { DA_TYPES } from "./IrConstants";

export function FieldError({ message }) {
    if (!message) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-destructive mt-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {message}
        </p>
    );
}

export function SectionCard({ icon: Icon, title, children, className }) {
    return (
        <Card className={cn("shadow-sm", className)}>
            <CardHeader className="px-6 py-4 border-b bg-muted/30 rounded-t-xl">
                <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                    </span>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">{children}</CardContent>
        </Card>
    );
}

export function ReadOnlyField({ label, value, placeholder = "Auto-filled on selection" }) {
    return (
        <div>
            <Label className="mb-1.5 block text-muted-foreground text-xs uppercase tracking-wide">
                {label}
            </Label>
            <Input
                readOnly
                value={value ?? ""}
                placeholder={placeholder}
                className="bg-muted/40 text-sm"
            />
        </div>
    );
}

export function OffenseBadge({ value }) {
    const da = DA_TYPES.find((d) => d.value === String(value));
    if (!da) return <span className="text-muted-foreground">—</span>;
    return (
        <Badge className={cn("whitespace-nowrap", da.badgeClass)}>
            {da.label}
        </Badge>
    );
}
