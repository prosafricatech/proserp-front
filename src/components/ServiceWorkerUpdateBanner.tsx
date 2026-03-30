import { useServiceWorkerUpdatePrompt } from '../hooks/useServiceWorkerUpdatePrompt';

export function ServiceWorkerUpdateBanner() {
  const { updateAvailable, reloadPage } = useServiceWorkerUpdatePrompt();

  if (!updateAvailable) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
        color: '#fff',
        padding: '18px 24px',
        textAlign: 'center',
        zIndex: 13000,
        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        gap: '16px',
      }}
    >
      <span style={{ display: 'inline-block' }}>
        <svg style={{verticalAlign: 'middle', marginRight: 8}} width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#fff" fillOpacity="0.15"/><path d="M12 8v4m0 4h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        A new version is available.
      </span>
      <button
        style={{
          marginLeft: '16px',
          background: '#fff',
          color: '#1976d2',
          border: 'none',
          padding: '8px 24px',
          borderRadius: '20px',
          fontWeight: 600,
          fontSize: '1rem',
          boxShadow: '0 1px 4px rgba(25, 118, 210, 0.10)',
          cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s',
        }}
        onClick={reloadPage}
        onMouseOver={e => {
          (e.currentTarget as HTMLButtonElement).style.background = '#e3f2fd';
        }}
        onMouseOut={e => {
          (e.currentTarget as HTMLButtonElement).style.background = '#fff';
        }}
      >
        Reload Now
      </button>
    </div>
  );
}
