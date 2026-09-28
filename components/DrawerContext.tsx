import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type DrawerCtx = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const DrawerContext = createContext<DrawerCtx | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((previous) => !previous), []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
    }),
    [close, isOpen, open, toggle]
  );

  return (
    <DrawerContext.Provider value={value}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer must be used inside DrawerProvider");
  return ctx;
}
