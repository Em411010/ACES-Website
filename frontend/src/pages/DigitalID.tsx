import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currentUser, currentRole } from "@/data/mock";
import { CircuitPattern } from "@/components/ui/circuit-pattern";

export default function DigitalID() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Your digital membership ID. Show the QR code for event attendance scanning.
      </p>

      {/* ID Card */}
      <Card className="relative overflow-hidden border-gold/30">
        {/* Top Banner */}
        <div className="h-24 bg-gradient-to-r from-navy via-navy-light to-navy relative">
          <CircuitPattern className="absolute inset-0 w-full h-full text-cyan" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-gold font-bold font-heading text-lg tracking-wider">
                A.C.E.S.
              </h3>
              <p className="text-white/50 text-[10px] tracking-widest uppercase">
                Association of Computer Engineering Students
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 pt-8 text-center">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full border-4 border-gold/30 bg-gold/10 mx-auto -mt-16 relative z-10 flex items-center justify-center">
            <span className="text-2xl font-bold font-heading text-gold">
              {currentUser.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>

          <h2 className="text-xl font-bold font-heading mt-3">
            {currentUser.fullName}
          </h2>
          <Badge
            className="mt-1 border-0 font-semibold"
            style={{
              backgroundColor: `${currentRole.color}20`,
              color: currentRole.color,
            }}
          >
            {currentRole.name}
          </Badge>

          <div className="mt-4 space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{currentUser.studentNumber}</span>
            </p>
            <p>Year {currentUser.yearLevel} — Computer Engineering</p>
            <p className="text-xs">{currentUser.email}</p>
          </div>

          {/* QR Code Placeholder */}
          <div className="mt-6 inline-flex flex-col items-center">
            <div className="w-40 h-40 bg-white border-2 border-border rounded-lg flex items-center justify-center p-2">
              {/* Fake QR pattern */}
              <div className="w-full h-full bg-[repeating-conic-gradient(#0F1B2D_0%_25%,#fff_0%_50%)] bg-[length:8px_8px] rounded opacity-80" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">
              {currentUser.digitalIDHash}
            </p>
          </div>
        </CardContent>

        {/* Bottom accent */}
        <div className="h-1.5 bg-gradient-to-r from-gold via-cyan to-gold" />
      </Card>
    </div>
  );
}
