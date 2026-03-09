export default function DayflowLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="url(#dayflow-grad)" />
      <defs>
        <linearGradient id="dayflow-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {/* Calendar grid dots — 3x3 */}
      {[14, 22, 30].map(x =>
        [15, 23, 31].map(y => (
          <rect key={`${x}-${y}`} x={x - 2} y={y - 2} width="4" height="4" rx="1" fill="rgba(255,255,255,0.35)" />
        ))
      )}
      {/* Flow arrow */}
      <path d="M8 24 Q18 18 28 24 Q36 29 40 24" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M37 21 L40 24 L37 27" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
