import { useStore } from '../store/useStore';

export function ExitButton() {
  const isZoomMode = useStore((state) => state.isZoomMode);
  const exitZoomMode = useStore((state) => state.exitZoomMode);

  if (!isZoomMode) return null;

  return (
    <svg
      className="zoom-exit-btn"
      onClick={exitZoomMode}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 11 11"
      shapeRendering="crispEdges"
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        zIndex: 9999,
        transition: 'transform 0.1s ease',
      }}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
    >
      {/* 像素紅色背景 */}
      <rect width="11" height="11" fill="#FF0000" />

      {/* 更簡潔的 11x11 像素白 X 實現 */}
      <rect x="2" y="2" width="1" height="1" fill="#ffffff" />
      <rect x="8" y="2" width="1" height="1" fill="#ffffff" />
      <rect x="3" y="3" width="1" height="1" fill="#ffffff" />
      <rect x="7" y="3" width="1" height="1" fill="#ffffff" />
      <rect x="4" y="4" width="1" height="1" fill="#ffffff" />
      <rect x="6" y="4" width="1" height="1" fill="#ffffff" />
      <rect x="5" y="5" width="1" height="1" fill="#ffffff" />
      <rect x="4" y="6" width="1" height="1" fill="#ffffff" />
      <rect x="6" y="6" width="1" height="1" fill="#ffffff" />
      <rect x="3" y="7" width="1" height="1" fill="#ffffff" />
      <rect x="7" y="7" width="1" height="1" fill="#ffffff" />
      <rect x="2" y="8" width="1" height="1" fill="#ffffff" />
      <rect x="8" y="8" width="1" height="1" fill="#ffffff" />
    </svg>
  );
}
