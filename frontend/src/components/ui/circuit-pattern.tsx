export function CircuitPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Horizontal traces */}
      <line x1="0" y1="50" x2="120" y2="50" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="160" y1="50" x2="400" y2="50" stroke="currentColor" strokeWidth="1.5" opacity="0.1" />
      <line x1="0" y1="150" x2="200" y2="150" stroke="currentColor" strokeWidth="1.5" opacity="0.12" />
      <line x1="240" y1="150" x2="400" y2="150" stroke="currentColor" strokeWidth="1.5" opacity="0.08" />
      <line x1="0" y1="250" x2="80" y2="250" stroke="currentColor" strokeWidth="1.5" opacity="0.1" />
      <line x1="120" y1="250" x2="300" y2="250" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="0" y1="350" x2="180" y2="350" stroke="currentColor" strokeWidth="1.5" opacity="0.08" />

      {/* Vertical traces */}
      <line x1="100" y1="0" x2="100" y2="120" stroke="currentColor" strokeWidth="1.5" opacity="0.12" />
      <line x1="200" y1="80" x2="200" y2="280" stroke="currentColor" strokeWidth="1.5" opacity="0.1" />
      <line x1="300" y1="0" x2="300" y2="200" stroke="currentColor" strokeWidth="1.5" opacity="0.08" />
      <line x1="350" y1="100" x2="350" y2="400" stroke="currentColor" strokeWidth="1.5" opacity="0.1" />

      {/* Angled traces */}
      <line x1="120" y1="50" x2="160" y2="90" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="160" y1="90" x2="160" y2="50" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
      <line x1="200" y1="150" x2="240" y2="150" stroke="currentColor" strokeWidth="1.5" opacity="0.12" />
      <line x1="80" y1="250" x2="120" y2="210" stroke="currentColor" strokeWidth="1.5" opacity="0.1" />
      <line x1="120" y1="210" x2="120" y2="250" stroke="currentColor" strokeWidth="1.5" opacity="0.1" />

      {/* Circuit nodes (small circles at junctions) */}
      <circle cx="120" cy="50" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="200" cy="150" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="100" cy="120" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="300" cy="200" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="80" cy="250" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="350" cy="100" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="160" cy="50" r="2.5" fill="currentColor" opacity="0.18" />

      {/* Small IC-style rectangles */}
      <rect x="185" y="140" width="30" height="20" rx="2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.1" />
      <rect x="90" y="240" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.08" />
    </svg>
  );
}
