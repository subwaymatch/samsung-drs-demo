import { useId } from 'react';

const SHAPE = 'M44 1C51 1 57 2 61 6L86.2 43.5C87.2 45 87.3 47 86.6 48.5L76.5 71.5C75.6 73.5 73.6 74.5 71.6 73.9C53.5 66.5 34.5 66.5 16.4 73.9C14.4 74.5 12.4 73.5 11.5 71.5L1.4 48.5C0.7 47 0.8 45 1.8 43.5L27 6C31 2 37 1 44 1Z';

/** The DRS mark: three stacked layers, like sheets coming out of a printer. */
export function DrsLogo({ width = 34, label }: { width?: number; label?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 88 76" width={width} height={Math.round((width * 76) / 88)} role="img" aria-label={label || 'DRS'} className="block flex-none">
      <defs>
        <clipPath id={'drs' + id}>
          <path d={SHAPE} />
        </clipPath>
      </defs>
      <path d={SHAPE} fill="oklch(0.8 0.1 293)" />
      <g clipPath={`url(#drs${id})`}>
        <path d={SHAPE} fill="oklch(0.66 0.16 293)" transform="translate(44 15) scale(0.92 1) translate(-44 0)" />
        <path d={SHAPE} fill="oklch(0.5 0.19 293)" transform="translate(44 31) scale(1.08 1) translate(-44 0)" />
      </g>
    </svg>
  );
}

export function SamsungWordmark({ width = 64 }: { width?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logos/samsung-wordmark.svg" alt="Samsung" width={width} style={{ width, height: 'auto', display: 'block', filter: 'brightness(0)' }} />;
}
