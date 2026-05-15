import { Badge } from "@/components/ui/badge"
import type { BadgeProps } from "@/components/ui/badge"
import type { LeadStatus, LeadPriority } from "../../types/crm.types"
import { LEAD_STATUS_LABELS, LEAD_PRIORITY_LABELS } from "../../types/crm.types"

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<LeadStatus, BadgeProps["variant"]> = {
  NEW: "info",
  CONTACTED: "secondary",
  QUALIFIED: "outline",
  PROPOSAL: "warning",
  NEGOTIATION: "warning",
  WON: "success",
  LOST: "destructive",
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>{LEAD_STATUS_LABELS[status]}</Badge>
  )
}

// ─── Priority badge ───────────────────────────────────────────────────────────

const PRIORITY_VARIANT: Record<LeadPriority, BadgeProps["variant"]> = {
  LOW: "muted",
  MEDIUM: "outline",
  HIGH: "warning",
  URGENT: "destructive",
}

export function LeadPriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]}>{LEAD_PRIORITY_LABELS[priority]}</Badge>
  )
}
