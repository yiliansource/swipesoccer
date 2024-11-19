import { GamePlayer, GameState } from "@swipesoccer/common";
import { atom } from "jotai";
import { v4 as uuidv4 } from "uuid";
import { socket } from "./socket";

export const isConnectedAtom = atom<boolean>(() => socket.connected);
export const playerAtom = atom<GamePlayer | null>(null);
export const gameStateAtom = atom<GameState | null>(null);
export const deviceTokenAtom = atom<string | null>(() => {
    const storageKey = "deviceToken";
    let deviceToken = window.localStorage.getItem(storageKey);
    if (!deviceToken) {
        deviceToken = uuidv4();
        window.localStorage.setItem(storageKey, deviceToken);
    }
    return deviceToken;
});
