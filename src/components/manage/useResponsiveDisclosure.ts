"use client";

import { useEffect, useState } from "react";

export default function useResponsiveDisclosure() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const syncWithViewport = () => setOpen(desktop.matches);
    syncWithViewport();
    desktop.addEventListener("change", syncWithViewport);
    return () => desktop.removeEventListener("change", syncWithViewport);
  }, []);

  return [open, setOpen] as const;
}
