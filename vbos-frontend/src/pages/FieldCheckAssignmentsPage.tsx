import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFieldCheckAssignments,
  getAssignableItems,
  type FieldCheckAssignment,
  type AssignableItem,
} from "@/api/getFieldCheckAssignments";
import { createFieldCheckAssignment, patchAssignmentStatus } from "@/api/createFieldCheckAssignment";
import { colors } from "@/tokens";
import {
  LuClipboardList,
  LuPlus,
  LuX,
  LuSearch,
  LuRefreshCw,
  LuFilter,
  LuCircleCheck,
  LuClock,
  LuCircleAlert,
  LuCircleDashed,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import { toast } from "@/utils/toast";

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "#dc2626", bg: "#dc262618" },
  high: { label: "High", color: "#ea580c", bg: "#ea580c18" },
  medium: { label: "Medium", color: "#ca8a04", bg: "#ca8a0418" },
  low: { label: "Low", color: "#16a34a", bg: "#16a34a18" },
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "#6b7280", icon: <LuCircleDashed size={13} /> },
  in_progress: { label: "In Progress", color: "#2563eb", icon: <LuClock size={13} /> },
  completed: { label: "Completed", color: "#16a34a", icon: <LuCircleCheck size={13} /> },
  skipped: { label: "Skipped", color: "#9ca3af", icon: <LuCircleAlert size={13} /> },
};

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority] ?? { label: priority, color: "#6b7280", bg: "#6b728018" };
  return (
    <span
      style={{
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.color}40`,
        borderRadius: 20,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, color: "#6b7280", icon: null };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color: m.color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
  onClick,
  active,
}: {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: "1 1 0",
        minWidth: 100,
        padding: "14px 16px",
        borderRadius: 10,
        border: `1.5px solid ${active ? color : colors.border.default}`,
        background: active ? `${color}12` : colors.bg.secondary,
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 3 }}>{label}</div>
    </button>
  );
}

// ─── Create Assignment Modal ──────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateAssignmentModal({ onClose, onCreated }: CreateModalProps) {
  const queryClient = useQueryClient();
  const [eventFilter, setEventFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [councilFilter, setCouncilFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<AssignableItem | null>(null);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [notes, setNotes] = useState("");
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["assignable-items", eventFilter, sectorFilter, councilFilter],
    queryFn: () =>
      getAssignableItems({
        event: eventFilter || undefined,
        sector: sectorFilter || undefined,
        council: councilFilter || undefined,
      }),
  });

  const mutation = useMutation({
    mutationFn: createFieldCheckAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-check-assignments"] });
      toast.success("Assignment created", "The field check assignment has been saved.");
      onCreated();
    },
    onError: (err: Error) => {
      toast.error("Failed to create", err.message);
    },
  });

  // Group items by event → dataset
  const grouped = useMemo(() => {
    const map = new Map<string, { eventName: string; datasets: Map<string, AssignableItem[]> }>();
    for (const item of items) {
      const ek = item.event_slug || "no-event";
      if (!map.has(ek)) map.set(ek, { eventName: item.event_name || "No event", datasets: new Map() });
      const event = map.get(ek)!;
      const dk = `${item.dataset_id}`;
      if (!event.datasets.has(dk)) event.datasets.set(dk, []);
      event.datasets.get(dk)!.push(item);
    }
    return map;
  }, [items]);

  const uniqueEvents = useMemo(
    () => [...new Set(items.map((i) => i.event_slug).filter(Boolean))],
    [items],
  );
  const uniqueSectors = useMemo(
    () => [...new Set(items.map((i) => i.sector_family).filter(Boolean))],
    [items],
  );

  function handleSubmit() {
    if (!selectedItem) {
      toast.error("No item selected", "Select a RAP estimate item to assign.");
      return;
    }
    if (!selectedItem.council_id) {
      toast.error("No council", "The selected item has no linked area council.");
      return;
    }
    mutation.mutate({
      content_type: selectedItem.content_type_id,
      object_id: selectedItem.object_id,
      area_council: selectedItem.council_id,
      priority,
      admin_notes: notes,
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: colors.bg.primary,
          borderRadius: 14,
          border: `1px solid ${colors.border.default}`,
          width: "100%",
          maxWidth: 740,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Create Field Check Assignment</div>
            <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
              Select a RAP damage estimate item and assign it to a field team for verification.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: colors.text.muted, padding: 4 }}
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 20px",
            borderBottom: `1px solid ${colors.border.default}`,
            flexWrap: "wrap",
          }}
        >
          <select
            value={eventFilter}
            onChange={(e) => { setEventFilter(e.target.value); setSelectedItem(null); }}
            style={{
              flex: "1 1 140px",
              padding: "6px 10px",
              borderRadius: 7,
              border: `1px solid ${colors.border.default}`,
              background: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: 12,
            }}
          >
            <option value="">All events</option>
            {uniqueEvents.map((ev) => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
          <select
            value={sectorFilter}
            onChange={(e) => { setSectorFilter(e.target.value); setSelectedItem(null); }}
            style={{
              flex: "1 1 140px",
              padding: "6px 10px",
              borderRadius: 7,
              border: `1px solid ${colors.border.default}`,
              background: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: 12,
            }}
          >
            <option value="">All sectors</option>
            {uniqueSectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div style={{ position: "relative", flex: "1 1 160px" }}>
            <LuSearch
              size={13}
              style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: colors.text.muted }}
            />
            <input
              placeholder="Filter by council..."
              value={councilFilter}
              onChange={(e) => { setCouncilFilter(e.target.value); setSelectedItem(null); }}
              style={{
                width: "100%",
                padding: "6px 10px 6px 28px",
                borderRadius: 7,
                border: `1px solid ${colors.border.default}`,
                background: colors.bg.secondary,
                color: colors.text.primary,
                fontSize: 12,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Item browser */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {isLoading && (
            <div style={{ textAlign: "center", color: colors.text.muted, padding: 40, fontSize: 13 }}>
              <LuRefreshCw size={20} style={{ margin: "0 auto 8px", display: "block" }} />
              Loading RAP items…
            </div>
          )}
          {!isLoading && grouped.size === 0 && (
            <div style={{ textAlign: "center", color: colors.text.muted, padding: 40, fontSize: 13 }}>
              No damage estimate items found. Import RAP datasets first.
            </div>
          )}
          {[...grouped.entries()].map(([ek, { eventName, datasets }]) => (
            <div key={ek} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                {eventName}
              </div>
              {[...datasets.entries()].map(([dk, dsItems]) => {
                const ds = dsItems[0];
                const isExpanded = expandedDataset === dk;
                return (
                  <div
                    key={dk}
                    style={{
                      border: `1px solid ${colors.border.default}`,
                      borderRadius: 8,
                      marginBottom: 6,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setExpandedDataset(isExpanded ? null : dk)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        background: colors.bg.secondary,
                        border: "none",
                        cursor: "pointer",
                        color: colors.text.primary,
                        textAlign: "left",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{ds.dataset_name}</span>
                        <span style={{ fontSize: 11, color: colors.text.muted, marginLeft: 8 }}>
                          {ds.sector_family} · {dsItems.length} council{dsItems.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {isExpanded ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div>
                        {dsItems.map((item) => {
                          const isSelected = selectedItem?.object_id === item.object_id;
                          return (
                            <button
                              key={item.object_id}
                              onClick={() => !item.already_assigned && setSelectedItem(isSelected ? null : item)}
                              disabled={item.already_assigned}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                border: "none",
                                borderTop: `1px solid ${colors.border.default}`,
                                background: isSelected ? "#4D90FF15" : "transparent",
                                cursor: item.already_assigned ? "not-allowed" : "pointer",
                                opacity: item.already_assigned ? 0.5 : 1,
                                color: colors.text.primary,
                                textAlign: "left",
                              }}
                            >
                              <div>
                                <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>
                                  {item.council_name}
                                </span>
                                <span style={{ fontSize: 11, color: colors.text.muted, marginLeft: 8 }}>
                                  {item.province_name}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {item.intensity && (
                                  <span style={{ fontSize: 11, color: colors.text.muted }}>{item.intensity}</span>
                                )}
                                {item.value !== null && (
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#4D90FF" }}>
                                    {typeof item.value === "number" ? item.value.toFixed(1) : item.value}
                                  </span>
                                )}
                                {item.already_assigned && (
                                  <span style={{ fontSize: 11, color: "#ca8a04", fontStyle: "italic" }}>assigned</span>
                                )}
                                {isSelected && <LuCircleCheck size={14} color="#4D90FF" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Selected item summary + assignment config */}
        {selectedItem && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: `1px solid ${colors.border.default}`,
              background: "#4D90FF08",
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: "2 1 240px" }}>
              <div style={{ fontSize: 11, color: colors.text.muted, marginBottom: 4, fontWeight: 600 }}>SELECTED</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedItem.council_name}</div>
              <div style={{ fontSize: 12, color: colors.text.muted }}>{selectedItem.dataset_name}</div>
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label style={{ fontSize: 11, color: colors.text.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>
                PRIORITY
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 7,
                  border: `1px solid ${colors.border.default}`,
                  background: colors.bg.secondary,
                  color: colors.text.primary,
                  fontSize: 12,
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div style={{ flex: "2 1 240px" }}>
              <label style={{ fontSize: 11, color: colors.text.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>
                NOTES FOR FIELD TEAM
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. Focus on school buildings in the northern cluster..."
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 7,
                  border: `1px solid ${colors.border.default}`,
                  background: colors.bg.secondary,
                  color: colors.text.primary,
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "12px 20px",
            borderTop: `1px solid ${colors.border.default}`,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: `1px solid ${colors.border.default}`,
              background: "transparent",
              color: colors.text.secondary,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedItem || mutation.isPending}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: "none",
              background: selectedItem ? "#4D90FF" : "#4D90FF60",
              color: "#fff",
              cursor: selectedItem ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {mutation.isPending ? <LuRefreshCw size={13} /> : <LuPlus size={13} />}
            {mutation.isPending ? "Creating…" : "Create Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assignment Row ───────────────────────────────────────────────────────────

function AssignmentRow({
  a,
  onStatusChange,
}: {
  a: FieldCheckAssignment;
  onStatusChange: (id: number, status: string) => void;
}) {
  return (
    <tr
      style={{
        borderBottom: `1px solid ${colors.border.default}`,
        fontSize: 13,
      }}
    >
      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
        <PriorityBadge priority={a.priority} />
      </td>
      <td style={{ padding: "10px 14px" }}>
        <div style={{ fontWeight: 600 }}>{a.council_name}</div>
        <div style={{ fontSize: 11, color: colors.text.muted }}>{a.province_name}</div>
      </td>
      <td style={{ padding: "10px 14px" }}>
        <div>{a.dataset_name}</div>
        <div style={{ fontSize: 11, color: colors.text.muted }}>{a.sector_family}{a.intensity ? ` · ${a.intensity}` : ""}</div>
      </td>
      <td style={{ padding: "10px 14px", color: "#4D90FF", fontWeight: 600 }}>
        {a.estimated_value !== null && a.estimated_value !== undefined ? a.estimated_value.toFixed(1) : "—"}
      </td>
      <td style={{ padding: "10px 14px" }}>
        <StatusBadge status={a.status} />
      </td>
      <td style={{ padding: "10px 14px", color: colors.text.muted, fontSize: 12 }}>
        {a.event_name || "—"}
      </td>
      <td style={{ padding: "10px 14px" }}>
        {a.admin_notes ? (
          <span style={{ fontSize: 12, color: colors.text.secondary, maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {a.admin_notes}
          </span>
        ) : (
          <span style={{ color: colors.text.muted, fontSize: 12 }}>—</span>
        )}
      </td>
      <td style={{ padding: "10px 14px" }}>
        <select
          value={a.status}
          onChange={(e) => onStatusChange(a.id, e.target.value)}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: `1px solid ${colors.border.default}`,
            background: colors.bg.secondary,
            color: colors.text.secondary,
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
        </select>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function FieldCheckAssignmentsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [councilSearch, setCouncilSearch] = useState("");
  const [sortField, setSortField] = useState<"priority" | "assigned_at">("assigned_at");
  const [sortAsc, setSortAsc] = useState(false);

  const { data: assignments = [], isLoading, refetch } = useQuery({
    queryKey: ["field-check-assignments", statusFilter, councilSearch],
    queryFn: () =>
      getFieldCheckAssignments({
        status: statusFilter || undefined,
        council: councilSearch || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      patchAssignmentStatus(id, status as "pending" | "in_progress" | "completed" | "skipped"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-check-assignments"] });
    },
    onError: () => {
      toast.error("Update failed", "Could not update assignment status.");
    },
  });

  // Stats derived from assignments
  const stats = useMemo(() => {
    const pending = assignments.filter((a) => a.status === "pending").length;
    const in_progress = assignments.filter((a) => a.status === "in_progress").length;
    const completed = assignments.filter((a) => a.status === "completed").length;
    const skipped = assignments.filter((a) => a.status === "skipped").length;
    return { pending, in_progress, completed, skipped, total: assignments.length };
  }, [assignments]);

  const sorted = useMemo(() => {
    const arr = [...assignments];
    arr.sort((a, b) => {
      if (sortField === "priority") {
        const ai = PRIORITY_ORDER.indexOf(a.priority);
        const bi = PRIORITY_ORDER.indexOf(b.priority);
        return sortAsc ? ai - bi : bi - ai;
      }
      // assigned_at
      const d = new Date(a.assigned_at).getTime() - new Date(b.assigned_at).getTime();
      return sortAsc ? d : -d;
    });
    return arr;
  }, [assignments, sortField, sortAsc]);

  function toggleSort(field: "priority" | "assigned_at") {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(false); }
  }

  const thStyle: React.CSSProperties = {
    padding: "9px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    whiteSpace: "nowrap",
    borderBottom: `1px solid ${colors.border.default}`,
    background: colors.bg.secondary,
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto", color: colors.text.primary }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <LuClipboardList size={20} />
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Field Check Assignments</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: colors.text.muted, maxWidth: 540 }}>
            Assign RAP damage estimates to field teams for on-site verification. Field officers see these assignments in the mobile app and submit observations that feed back into DRMIS.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 16px",
            borderRadius: 9,
            border: "none",
            background: "#4D90FF",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <LuPlus size={15} />
          New Assignment
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total" value={stats.total} color={colors.text.secondary} onClick={() => setStatusFilter("")} active={!statusFilter} />
        <StatCard label="Pending" value={stats.pending} color="#6b7280" onClick={() => setStatusFilter("pending")} active={statusFilter === "pending"} />
        <StatCard label="In Progress" value={stats.in_progress} color="#2563eb" onClick={() => setStatusFilter("in_progress")} active={statusFilter === "in_progress"} />
        <StatCard label="Completed" value={stats.completed} color="#16a34a" onClick={() => setStatusFilter("completed")} active={statusFilter === "completed"} />
        <StatCard label="Skipped" value={stats.skipped} color="#9ca3af" onClick={() => setStatusFilter("skipped")} active={statusFilter === "skipped"} />
      </div>

      {/* Filters bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <LuFilter size={14} style={{ color: colors.text.muted }} />
        <div style={{ position: "relative" }}>
          <LuSearch size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: colors.text.muted }} />
          <input
            placeholder="Search by council…"
            value={councilSearch}
            onChange={(e) => setCouncilSearch(e.target.value)}
            style={{
              padding: "6px 10px 6px 28px",
              borderRadius: 7,
              border: `1px solid ${colors.border.default}`,
              background: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: 12,
              width: 200,
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 7,
            border: `1px solid ${colors.border.default}`,
            background: colors.bg.secondary,
            color: colors.text.primary,
            fontSize: 12,
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
        </select>
        <button
          onClick={() => refetch()}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 7, border: `1px solid ${colors.border.default}`, background: "transparent", color: colors.text.muted, fontSize: 12, cursor: "pointer" }}
        >
          <LuRefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          border: `1px solid ${colors.border.default}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: colors.text.muted, fontSize: 13 }}>
            <LuRefreshCw size={20} style={{ margin: "0 auto 10px", display: "block" }} />
            Loading assignments…
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: colors.text.muted }}>
            <LuClipboardList size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No assignments yet</div>
            <div style={{ fontSize: 13 }}>
              Click <strong>New Assignment</strong> to assign a RAP estimate to a field team.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => toggleSort("priority")}>
                    Priority {sortField === "priority" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th style={thStyle}>Council</th>
                  <th style={thStyle}>Dataset / Sector</th>
                  <th style={thStyle}>RAP Estimate</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Event</th>
                  <th style={thStyle}>Admin Notes</th>
                  <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => toggleSort("assigned_at")}>
                    Assigned {sortField === "assigned_at" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((a) => (
                  <AssignmentRow
                    key={a.id}
                    a={a}
                    onStatusChange={(id, s) => statusMutation.mutate({ id, status: s })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
