import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import { mockRoles } from "@/data/mock";

const permissionCategories = [
  {
    name: "Administration",
    keys: [
      { key: "MANAGE_ROLES", label: "Manage Roles" },
      { key: "MANAGE_MEMBERS", label: "Manage Members" },
      { key: "VIEW_AUDIT_LOGS", label: "View Audit Logs" },
    ],
  },
  {
    name: "Communications",
    keys: [
      { key: "POST_ANNOUNCEMENT", label: "Post Announcement" },
      { key: "MANAGE_DOCUMENTS", label: "Manage Documents" },
      { key: "BYPASS_MUST_READ", label: "Bypass Must Read" },
    ],
  },
  {
    name: "Operations",
    keys: [
      { key: "CREATE_TASK", label: "Create Tasks" },
      { key: "APPROVE_SUBMISSIONS", label: "Approve Submissions" },
      { key: "SCAN_ATTENDANCE", label: "Scan Attendance" },
    ],
  },
];

export default function RoleManager() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Role List */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Roles ({mockRoles.length})
          </h3>
          <button className="flex items-center gap-1 text-sm text-cyan hover:text-cyan-light transition-colors font-medium">
            <Plus size={16} />
            Add Role
          </button>
        </div>

        <div className="space-y-1">
          {[...mockRoles]
            .sort((a, b) => a.position - b.position)
            .map((role) => (
              <Card
                key={role._id}
                className="cursor-pointer hover:border-cyan/30 transition-all group"
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <GripVertical
                    size={14}
                    className="text-muted-foreground/30 shrink-0 cursor-grab active:cursor-grabbing"
                  />
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: role.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{role.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {role.permissions.length} permissions · Position {role.position}
                    </p>
                  </div>
                  {!role.isEditable && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Default
                    </Badge>
                  )}
                  {role.isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded hover:bg-muted">
                        <Pencil size={12} className="text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-destructive/10">
                        <Trash2 size={12} className="text-destructive" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Permission Matrix Preview */}
      <Card className="lg:col-span-3">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Permission Matrix
          </h3>

          <div className="space-y-5">
            {permissionCategories.map((cat) => (
              <div key={cat.name}>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  {cat.name}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 pr-4 font-medium text-muted-foreground">
                          Permission
                        </th>
                        {mockRoles.slice(0, 5).map((r) => (
                          <th key={r._id} className="px-2 py-1.5 text-center">
                            <div
                              className="w-2 h-2 rounded-full mx-auto mb-0.5"
                              style={{ backgroundColor: r.color }}
                            />
                            <span className="font-medium" style={{ color: r.color }}>
                              {r.name.length > 8 ? r.name.slice(0, 8) + "…" : r.name}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cat.keys.map((perm) => (
                        <tr key={perm.key} className="border-b border-border/50">
                          <td className="py-1.5 pr-4 text-muted-foreground">
                            {perm.label}
                          </td>
                          {mockRoles.slice(0, 5).map((r) => (
                            <td key={r._id} className="text-center px-2 py-1.5">
                              {r.permissions.includes(perm.key) ? (
                                <span className="text-success">✓</span>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
