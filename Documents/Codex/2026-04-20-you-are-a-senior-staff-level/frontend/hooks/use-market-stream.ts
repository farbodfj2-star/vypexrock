"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { appConfig } from "@/lib/config";
import type { MarketTicker } from "@/types";

export function useMarketStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      queryClient.setQueryData(["market-stream-status"], {
        status: "reconnecting",
        lastUpdate: new Date().toISOString()
      });
      socket = new WebSocket(appConfig.wsUrl);
      socket.onopen = () => {
        queryClient.setQueryData(["market-stream-status"], {
          status: "connected",
          lastUpdate: new Date().toISOString()
        });
      };
      socket.onmessage = (event) => {
        const update = JSON.parse(event.data) as {
          symbol: string;
          price: string;
          change_24h: string;
          volume_24h: string;
        };

        queryClient.setQueryData<MarketTicker[]>(["dashboard"], (current) => {
          const rows = current ?? [];
          const exists = rows.some((row) => row.symbol === update.symbol);
          if (!exists) {
            return [
              ...rows,
              {
                symbol: update.symbol,
                price: Number(update.price),
                change_24h: Number(update.change_24h),
                volume_24h: Number(update.volume_24h),
                metadata_name: update.symbol === "XAUUSD" ? "Gold Spot" : update.symbol.replace("USDT", "")
              }
            ];
          }
          return rows.map((row) =>
            row.symbol === update.symbol
              ? {
                  ...row,
                  price: Number(update.price),
                  change_24h: Number(update.change_24h),
                  volume_24h: Number(update.volume_24h)
                }
              : row
          );
        });

        queryClient.setQueriesData({ queryKey: ["coin"] }, (current: unknown) => {
          if (!current || typeof current !== "object") {
            return current;
          }

          const detail = current as {
            symbol?: string;
            ticker?: MarketTicker;
          };

          if (detail.symbol !== update.symbol || !detail.ticker) {
            return current;
          }

          return {
            ...detail,
            ticker: {
              ...detail.ticker,
              price: Number(update.price),
              change_24h: Number(update.change_24h),
              volume_24h: Number(update.volume_24h)
            }
          };
        });

        queryClient.setQueryData(["market-stream-status"], {
          status: "connected",
          lastUpdate: new Date().toISOString()
        });
      };
      socket.onclose = () => {
        queryClient.setQueryData(["market-stream-status"], {
          status: "reconnecting",
          lastUpdate: new Date().toISOString()
        });
        reconnectTimer = window.setTimeout(connect, 2500);
      };
      socket.onerror = () => {
        queryClient.setQueryData(["market-stream-status"], {
          status: "disconnected",
          lastUpdate: new Date().toISOString()
        });
      };
    };

    connect();

    return () => {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [queryClient]);
}
