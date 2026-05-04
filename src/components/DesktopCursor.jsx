import { useEffect, useRef } from "react";

function lerp(a, b, factor) {
  return a + (b - a) * factor;
}

export default function DesktopCursor() {
  const dotRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine) and (min-width: 768px)").matches) return;

    const dot = dotRef.current;
    if (!dot) return;

    const raw = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    let hasPointer = false;
    let rafId = null;

    const render = () => {
      smooth.x = lerp(smooth.x, raw.x, 0.16);
      smooth.y = lerp(smooth.y, raw.y, 0.16);
      dot.style.transform = `translate3d(${smooth.x - 4}px, ${smooth.y - 4}px, 0)`;
      dot.style.opacity = hasPointer ? "1" : "0";

      if (Math.abs(raw.x - smooth.x) > 0.1 || Math.abs(raw.y - smooth.y) > 0.1) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
      }
    };

    const schedule = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(render);
      }
    };

    const onMove = (event) => {
      hasPointer = true;
      raw.x = event.clientX;
      raw.y = event.clientY;
      schedule();
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--crimson)",
        pointerEvents: "none",
        zIndex: 9999,
        opacity: 0,
        willChange: "transform, opacity",
      }}
    />
  );
}
