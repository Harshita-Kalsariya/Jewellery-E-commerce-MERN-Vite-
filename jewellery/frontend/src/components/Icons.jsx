/** Inline SVG icons — consistent stroke weight for header + product actions */

export function IconShoppingBag({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 7h12l-1 13H7L6 7z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V5.5a3 3 0 116 0V7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconHeart({ filled = false, className = "" }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path
          fill="currentColor"
          d="M12 21s-6.716-4.432-9-8.5C.58 9.268 1.5 5.5 5.25 5.5 7.8 5.5 9 7.12 9 7.12S10.2 5.5 12.75 5.5c3.75 0 4.67 3.768 2.25 7C15.716 16.568 12 21 12 21z"
        />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 20.5l-1.1-.9C5.5 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 1 4.5 2.5C13.09 4 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.5 6.86-8.9 11.1l-1.1.9z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconUserCircle({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.65" />
      <circle cx="12" cy="10" r="2.75" stroke="currentColor" strokeWidth="1.65" />
      <path
        d="M6.5 18.2c.85-2.1 2.6-3.45 5.5-3.45s4.65 1.35 5.5 3.45"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}
