import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, ChevronDown, BellRing, CheckCircle2 } from "lucide-react";
import { mockUsers, getRoleById } from "@/data/mock";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function MemberDirectory() {
  const { user: currentUser, notifyProfileUpdate } = useAuth();
  const canManageMembers = currentUser?.roleId?.permissions.includes("MANAGE_MEMBERS") ?? false;
  const [notified, setNotified] = useState(false);
  const [notifying, setNotifying] = useState(false);

  async function handleNotify() {
    setNotifying(true);
    try {
      await notifyProfileUpdate();
      setNotified(true);
      setTimeout(() => setNotified(false), 4000);
    } finally {
      setNotifying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input text-sm text-muted-foreground hover:border-foreground/20 transition-colors">
          All Roles <ChevronDown size={14} />
        </button>
        {canManageMembers && (
          <button
            onClick={handleNotify}
            disabled={notifying || notified}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              disabled:opacity-70 disabled:cursor-not-allowed
              bg-gold/10 border border-gold/40 text-gold hover:bg-gold/20 hover:border-gold/60"
          >
            {notified ? (
              <>
                <CheckCircle2 size={15} />
                Notified!
              </>
            ) : (
              <>
                <BellRing size={15} className={notifying ? "animate-pulse" : ""} />
                Request Profile Update
              </>
            )}
          </button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Member</th>
                <th className="text-left py-3 px-4 font-medium">Student No.</th>
                <th className="text-left py-3 px-4 font-medium">Year</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => {
                const role = getRoleById(user.roleId);
                return (
                  <tr
                    key={user._id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className="text-xs font-bold"
                            style={{
                              backgroundColor: `${role?.color}20`,
                              color: role?.color,
                            }}
                          >
                            {user.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium group-hover:text-cyan transition-colors">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {user.studentNumber}
                    </td>
                    <td className="py-3 px-4">{user.yearLevel}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className="border-0 font-semibold text-xs"
                        style={{
                          backgroundColor: `${role?.color}20`,
                          color: role?.color,
                        }}
                      >
                        {role?.name}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-xs text-cyan hover:underline opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        Change Role
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
