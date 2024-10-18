"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";

import { getTrackFunction } from "./utils";

type UmamiAnalyticsContextType = {
  autoTrack?: boolean;
  domains?: string[];
  loaded: boolean;
  processUrl?: (url: string) => string;
  src: string;
  websiteId: string;
};

type Props = Omit<UmamiAnalyticsContextType, "loaded"> & {
  children: ReactNode;
};

export const umamiAnalyticsContextFactory = function <
  TEventData extends Partial<
    Record<TEventNames[number], { [key: string]: unknown }>
  >,
  TEventNames extends readonly string[],
>(eventNames: TEventNames) {
  const UmamiAnalyticsContext = createContext<
    UmamiAnalyticsContextType | undefined
  >(undefined);

  const UmamiAnalyticsProvider = function ({
    autoTrack = true,
    children,
    src,
    websiteId,
    ...options
  }: Props) {
    const [loaded, setLoaded] = useState(false);
    if (!src) {
      throw new Error("Script source is required");
    }
    if (!websiteId) {
      throw new Error("websiteId is required");
    }

    return (
      <>
        <UmamiAnalyticsContext.Provider
          value={{ autoTrack, loaded, src, websiteId, ...options }}
        >
          {children}
        </UmamiAnalyticsContext.Provider>
        <Script
          async
          data-auto-track={autoTrack.toString()}
          data-website-id={websiteId}
          src={src}
          {...(options.domains !== undefined &&
            Array.isArray(options.domains) &&
            options.domains.length > 0 && {
              "data-domains": options.domains.join(","),
            })}
          onLoad={() => setLoaded(true)}
        />
      </>
    );
  };

  const useUmami = function () {
    const context = useContext(UmamiAnalyticsContext);
    const pathname = usePathname();
    if (!context) {
      throw new Error(
        "UmamiAnalyticsProvider must be used to access the context",
      );
    }
    const { autoTrack, loaded, processUrl } = context;
    return useMemo(
      () =>
        loaded
          ? {
              track: getTrackFunction<TEventData, TEventNames>(eventNames, {
                processUrl,
                // if autotrack is set to false (undefined defaults to true in umami), internal url is not updated
                // so we must do it ourselves! (that's why we send pathname)
                ...(autoTrack === false && { pathname }),
              }),
            }
          : {},
      [autoTrack, loaded, processUrl, pathname],
    );
  };

  return {
    UmamiAnalyticsContext,
    UmamiAnalyticsProvider,
    useUmami,
  };
};
