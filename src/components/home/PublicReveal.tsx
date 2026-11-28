"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type PublicRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function PublicReveal({ children, className = "", delay = 0 }: PublicRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const bounds = element.getBoundingClientRect();
    const isInitiallyVisible = bounds.top < window.innerHeight - 35 && bounds.bottom > 0;
    setReady(true);

    if (isInitiallyVisible) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.unobserve(entry.target);
    }, { threshold: 0.12, rootMargin: "0px 0px -35px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className={`public-reveal${ready ? " is-ready" : ""}${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--public-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
