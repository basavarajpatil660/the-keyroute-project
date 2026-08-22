/**
 * SectionDivider — thin hairline with a centered route-node dot.
 *
 * Purpose: BentoGrid and WhyKeyrouteSection (and other adjacent sections)
 * can share the same .section-alt background with nothing between them,
 * so they visually fuse into one slab. This renders in normal document
 * flow (no .section-alt wrapper), so it always shows the page's base
 * background — creating a real seam between sections regardless of
 * which background color sits on either side.
 *
 * Styled as a route node rather than a plain rule, echoing the
 * hub/packet language in HeroNetworkBackground and the trace lines
 * in BentoGrid, instead of an arbitrary decorative line.
 */
export function SectionDivider() {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '0 0',
        height: 1,
        margin: '0',
      }}
    >
      <span
        style={{
          width: 64,
          maxWidth: '18vw',
          height: 1,
          background:
            'linear-gradient(to left, var(--color-border) 0%, transparent 100%)',
        }}
      />
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'var(--color-indigo)',
          opacity: 0.55,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          width: 64,
          maxWidth: '18vw',
          height: 1,
          background:
            'linear-gradient(to right, var(--color-border) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}
