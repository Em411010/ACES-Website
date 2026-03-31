import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CalendarDays } from "lucide-react";

const mockDocuments = [
  { _id: "d1", title: "ACES Bylaws (Revised 2026)", type: "PDF", date: "2026-03-25", size: "1.2 MB" },
  { _id: "d2", title: "Memorandum No. 2026-003 — Engineering Week", type: "PDF", date: "2026-03-20", size: "540 KB" },
  { _id: "d3", title: "Financial Report — Q1 2026", type: "PDF", date: "2026-03-15", size: "2.1 MB" },
  { _id: "d4", title: "Memorandum No. 2026-002 — General Assembly", type: "PDF", date: "2026-02-28", size: "320 KB" },
  { _id: "d5", title: "Annual Plan — A.Y. 2025-2026", type: "PDF", date: "2026-01-10", size: "3.4 MB" },
];

export default function Documents() {
  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{mockDocuments.length} documents</p>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          + Upload Document
        </button>
      </div>

      <div className="space-y-2">
        {mockDocuments.map((doc) => (
          <Card key={doc._id} className="hover:border-cyan/30 transition-colors group cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate group-hover:text-cyan transition-colors">
                  {doc.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">{doc.type}</Badge>
                  <span>·</span>
                  <span>{doc.size}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={10} />
                    {new Date(doc.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10 transition-all opacity-0 group-hover:opacity-100">
                <Download size={18} />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
