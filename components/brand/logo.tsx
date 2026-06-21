/**
 * Logo FADE OS — mark "fade": các thanh cao dần (kiểu tóc fade + nhịp 'OS'),
 * đặt trong badge bo góc gradient đồng. Dùng ở sidebar, đăng nhập, favicon.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="FADE OS" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fadeos-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B5743A" />
          <stop offset="1" stopColor="#8A5326" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#fadeos-logo-g)" />
      <g fill="#F8F3EC">
        <rect x="11.5" y="28" width="4.5" height="8.5" rx="2.25" />
        <rect x="18.75" y="22.5" width="4.5" height="14" rx="2.25" />
        <rect x="26" y="17" width="4.5" height="19.5" rx="2.25" />
        <rect x="33.25" y="12" width="4.5" height="24.5" rx="2.25" />
      </g>
    </svg>
  );
}

/** Mark GitHub (lucide v1 đã bỏ icon thương hiệu). */
export function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.55 0-.27-.01-1-.02-1.96-3.34.71-4.04-1.59-4.04-1.59-.55-1.37-1.33-1.74-1.33-1.74-1.09-.73.08-.72.08-.72 1.2.08 1.83 1.22 1.83 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.21a11.6 11.6 0 0 1 6 0c2.29-1.53 3.3-1.21 3.3-1.21.66 1.65.24 2.87.12 3.17.77.83 1.23 1.88 1.23 3.17 0 4.54-2.81 5.53-5.49 5.82.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .31.21.68.83.56A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
    </svg>
  );
}
