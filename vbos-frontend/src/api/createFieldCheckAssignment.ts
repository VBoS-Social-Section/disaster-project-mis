import * as HTTP from "./http";
import type { FieldCheckAssignment } from "./getFieldCheckAssignments";

const BASE = "/api/v1";

export interface CreateAssignmentPayload {
  content_type: number;
  object_id: number;
  area_council: number;
  priority: "low" | "medium" | "high" | "critical";
  admin_notes: string;
}

export async function createFieldCheckAssignment(
  payload: CreateAssignmentPayload,
): Promise<FieldCheckAssignment> {
  const r = await HTTP.post(`${BASE}/field-check/assignments/`, payload as Record<string, unknown>);
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to create assignment");
  }
  return r.json();
}

export async function patchAssignmentStatus(
  id: number,
  status: "pending" | "in_progress" | "completed" | "skipped",
): Promise<FieldCheckAssignment> {
  const r = await HTTP.patch(`${BASE}/field-check/assignments/${id}/`, { status });
  if (!r.ok) throw new Error("Failed to update assignment");
  return r.json();
}
