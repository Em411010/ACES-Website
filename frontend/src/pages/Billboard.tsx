import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, AlertCircle } from "lucide-react";
import { mockAnnouncements, getUserById, getRoleById } from "@/data/mock";

export default function Billboard() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {mockAnnouncements.map((a) => {
        const author = getUserById(a.authorId);
        const role = author ? getRoleById(author.roleId) : undefined;
        return (
          <Card
            key={a._id}
            className={`transition-all duration-200 hover:shadow-md ${
              a.isMustRead ? "border-destructive/30 ring-1 ring-destructive/10" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className="font-bold text-sm"
                      style={{
                        backgroundColor: `${role?.color}20`,
                        color: role?.color,
                      }}
                    >
                      {author?.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{author?.fullName}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-0"
                        style={{
                          backgroundColor: `${role?.color}15`,
                          color: role?.color,
                        }}
                      >
                        {role?.name}
                      </Badge>
                      <span>·</span>
                      <Clock size={10} />
                      {new Date(a.createdAt).toLocaleDateString("en-PH", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                {a.isMustRead && (
                  <Badge variant="destructive" className="shrink-0 gap-1">
                    <AlertCircle size={12} />
                    Must Read
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg mt-3">{a.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {a.content.replace(/[#*]/g, "")}
              </p>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {a.acknowledgedBy.length} acknowledged
                </span>
                {a.isMustRead && (
                  <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:opacity-90 transition-opacity">
                    I Acknowledge
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
