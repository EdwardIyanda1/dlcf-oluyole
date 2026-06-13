export default function Logo({ size = 48, withText = true, light = false }) {
  const ink = light ? '#FAF6EE' : '#1C2541';
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.png" alt="DLCF LCU Logo" width={size} height={size} className="object-contain" />
      <img src="/logo.png" alt="DLCF LCU Logo" width={size} height={size} className="object-contain" />
      {withText && (
        <div className="leading-tight">
          <p
            className="text-[11px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: '#D4A857' }}
          >
            DLCF &middot; Oluyole Region
          </p>
          <p
            className="text-lg font-bold tracking-tight"
            style={{ color: ink, fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Retreat
          </p>
        </div>
      )}
    </div>
  );
}