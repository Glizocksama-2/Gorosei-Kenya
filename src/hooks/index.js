import { useEffect, useRef, useState } from "react";
import { lerp } from "../lib/productUtils.js";

export function useGlobalMouse() {
  const raw = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const norm = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0, nx: 0, ny: 0 });

  useEffect(() => {
    const onMove = (e) => {
      raw.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const loop = () => {
      smooth.current.x = lerp(smooth.current.x, raw.current.x, 0.08);
      smooth.current.y = lerp(smooth.current.y, raw.current.y, 0.08);
      norm.current.x = (smooth.current.x / window.innerWidth) * 2 - 1;
      norm.current.y = (smooth.current.y / window.innerHeight) * 2 - 1;
      setPos({
        x: smooth.current.x,
        y: smooth.current.y,
        nx: norm.current.x,
        ny: norm.current.y,
      });
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return pos;
}

export function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}
