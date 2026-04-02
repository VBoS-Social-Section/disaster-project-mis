import * as HTTP from "./http";

const BASE = "/api/v1";

export interface FieldCheckAssignment {
  id: number;
  tabular_item_id: number;
  dataset_name: string;
  sector_family: string;
  council_name: string;
  province_name: string;
  priority: "low" | "medium" | "high" | "critical";
  admin_notes: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  estimated_value: number | null;
  intensity: string;
  event_name: string;
  event_slug: string;
  assigned_at: string;
}

export interface AssignableItem {
  content_type_id: number;
  object_id: number;
  dataset_id: number;
  dataset_name: string;
  dataset_type: string;
  sector_family: string;
  event_name: string;
  event_slug: string;
  council_id: number | null;
  council_name: string;
  province_name: string;
  value: number | null;
  intensity: string;
  already_assigned: boolean;
}

export interface AssignmentsFilter {
  council?: string;
  status?: string;
}

export async function getFieldCheckAssignments(
  filter?: AssignmentsFilter,
): Promise<FieldCheckAssignment[]> {
  const params = new URLSearchParams();
  if (filter?.council) params.set("council", filter.council);
  if (filter?.status) params.set("status", filter.status);
  const qs = params.toString() ? `?${params}` : "";
  const r = await HTTP.get(`${BASE}/field-check/assignments/${qs}`);
  if (!r.ok) throw new Error("Failed to fetch assignments");
  return r.json();
}

export async function getAssignableItems(opts?: {
  event?: string;
  sector?: string;
  council?: string;
}): Promise<AssignableItem[]> {
  const params = new URLSearchParams();
  if (opts?.event) params.set("event", opts.event);
  if (opts?.sector) params.set("sector", opts.sector);
  if (opts?.council) params.set("council", opts.council);
  const qs = params.toString() ? `?${params}` : "";
  const r = await HTTP.get(`${BASE}/field-check/assignable-items/${qs}`);
  if (!r.ok) throw new Error("Failed to fetch assignable items");
  return r.json();
}
