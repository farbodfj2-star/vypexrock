"use client";
import { useEffect, useState } from "react";

type Coin = {
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
};

export default function CoinTable() {
    const [coins, setCoins] = useState<Coin[]>([]);

    useEffect(() => {
        fetch("http://localhost:8000/api/v1/market/dashboard")
            .then((res) => res.json())
            .then((data) => {
                const rows = Array.isArray(data) ? data : data.coins ?? [];
                setCoins(rows);
            })
            .catch((err) => {
                console.error("API error:", err);
            });
    }, []);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/api/v1/ws/market");

        ws.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            setCoins((prev: any[]) => prev.map((coin) => coin.symbol === data.symbol
                ? {
                    ...coin,
                    price: Number(data.price),
                    change_24h: Number(data.change_24h),
                    volume_24h: Number(data.volume_24h),
                }
                : coin
            )
            );
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <table className="w-full text-left">
            <thead>
                <tr>
                    <th>Coin</th>
                    <th>Price</th>
                    <th>24h</th>
                    <th>Volume</th>
                </tr>
            </thead>
            <tbody>
                {coins.map((coin: { symbol: any; price: any; change_24h: number; volume_24h: any; }) => (
                    <tr key={coin.symbol}>
                        <td>{coin.symbol}</td>
                        <td>${coin.price}</td>
                        <td
                            className={coin.change_24h >= 0 ? "text-green-400" : "text-red-400"}
                        >
                            {coin.change_24h}%
                        </td>
                        <td>{coin.volume_24h}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
