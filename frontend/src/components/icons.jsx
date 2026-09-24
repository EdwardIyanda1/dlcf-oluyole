// Minimal, dependency-free stroke icon set used across the admin panel and
// site chrome. Keeping these local (instead of pulling in an icon library)
// keeps the bundle small and the visuals consistent.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconOverview({ className = 'w-4.5 h-4.5' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconPrograms({ className = 'w-4.5 h-4.5' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}

export function IconAttendance({ className = 'w-4.5 h-4.5' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9 11l2 2 4-4" />
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18" />
    </svg>
  );
}

export function IconReports({ className = 'w-4.5 h-4.5' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  );
}

export function IconParticipants({ className = 'w-4.5 h-4.5' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17.5" cy="8.5" r="2.5" />
      <path d="M15.5 14.2c2.9.4 5 2.6 5 5.8" />
    </svg>
  );
}

export function IconMessaging({ className = 'w-4.5 h-4.5' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l7.5 6 7.5-6" />
    </svg>
  );
}

export function IconArrowLeft({ className = 'w-4 h-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function IconCheck({ className = 'w-6 h-6' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
