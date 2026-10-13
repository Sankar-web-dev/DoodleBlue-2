"use client";

import {
  Pencil,
  Trash2,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import type { Role } from "@/api/roles.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RESOURCE_LABELS, ACTION_LABELS, Resource, Action } from "@/lib/permissions";

interface RoleCardProps {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoleCard({ role, onEdit, onDelete }: RoleCardProps) {
  return (
    <Card className="border-border/60 bg-card/80 hover:border-primary/30 hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {role.isSystem ? <Lock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{role.name}</CardTitle>
              {role.description && (
                <CardDescription className="text-xs mt-0.5 truncate">
                  {role.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {role.isSystem && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">System</Badge>
            )}
            <Badge
              className={
                role.isActive
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-1.5 py-0.5"
                  : "bg-muted text-muted-foreground border-border/40 text-xs px-1.5 py-0.5"
              }
            >
              {role.isActive ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {role.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Permission summary */}
        <div className="space-y-1.5">
          {role.permissions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No permissions assigned.</p>
          ) : (
            role.permissions.map((perm) => (
              <div key={perm.resource} className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground/80">
                  {RESOURCE_LABELS[perm.resource as Resource] ?? perm.resource}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {(["create", "read", "update", "delete"] as Action[]).map((action) => (
                    <span
                      key={action}
                      className={`rounded px-1 py-0.5 text-[10px] font-medium leading-none ${
                        perm.actions.includes(action)
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/50 text-muted-foreground/40"
                      }`}
                    >
                      {ACTION_LABELS[action][0]}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/40"
            onClick={onDelete}
            disabled={role.isSystem}
            title={role.isSystem ? "System roles cannot be deleted" : undefined}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
