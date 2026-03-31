import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockRoles, mockUsers } from "@/data/mock";

export default function ChainOfCommand() {
  const orderedRoles = [...mockRoles]
    .filter((r) => r.position < 999)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Organizational hierarchy based on role positions.
      </p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-cyan to-muted-foreground/20 -translate-x-1/2" />

        <div className="space-y-6">
          {orderedRoles.map((role, index) => {
            const officers = mockUsers.filter((u) => u.roleId === role._id);
            return (
              <div key={role._id} className="relative flex justify-center">
                {/* Node dot */}
                <div
                  className="absolute left-1/2 top-6 w-3 h-3 rounded-full border-2 border-background -translate-x-1/2 z-10"
                  style={{ backgroundColor: role.color }}
                />

                <Card
                  className="w-full max-w-md hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                  style={{ borderColor: `${role.color}30` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className="border-0 font-semibold"
                          style={{
                            backgroundColor: `${role.color}20`,
                            color: role.color,
                          }}
                        >
                          {role.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Position {role.position}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {officers.length} {officers.length === 1 ? "officer" : "members"}
                      </span>
                    </div>

                    {role.officialDuties && (
                      <p className="text-xs text-muted-foreground mb-3 italic">
                        {role.officialDuties}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {officers.map((officer) => (
                        <div
                          key={officer._id}
                          className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              className="text-[10px] font-bold"
                              style={{
                                backgroundColor: `${role.color}20`,
                                color: role.color,
                              }}
                            >
                              {officer.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {officer.fullName}
                          </span>
                        </div>
                      ))}
                      {officers.length === 0 && (
                        <span className="text-xs text-muted-foreground/50 italic">
                          No assigned officers
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
