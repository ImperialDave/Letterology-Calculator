import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { getLiveTongue, parseTongue, subscribeTongue, type Tongue } from "@/lib/letterology/tongue";

const TongueContext = createContext<Tongue | null>(null);

export function TongueProvider({
  tongue,
  children,
}: {
  tongue: Tongue;
  children: ReactNode;
}) {
  return <TongueContext.Provider value={tongue}>{children}</TongueContext.Provider>;
}

/** Trust the live switch first. The URL is a follow-up, not the boss. */
export function useTongue(urlTongue: Tongue | string | undefined = "la"): Tongue {
  const fromUrl = parseTongue(urlTongue);
  const fromCtx = useContext(TongueContext);
  const [live, setLive] = useState<Tongue>(() => getLiveTongue() ?? fromCtx ?? fromUrl);

  useLayoutEffect(() => {
    return subscribeTongue(() => {
      const next = getLiveTongue();
      if (next) setLive(next);
    });
  }, []);

  return getLiveTongue() ?? live ?? fromCtx ?? fromUrl;
}
