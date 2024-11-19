import { Injectable } from "@nestjs/common";
import { LobbyModel } from "./lobby.model";
import { CreateLobbyDto } from "./lobby.dto";
import { v4 as uuidv4 } from "uuid";
@Injectable()
export class LobbyService {
    private lobbies: LobbyModel[] = [];

    public findIds(): string[] {
        return this.lobbies.map((l) => l.lobbyId);
    }
    public findById(id: string): LobbyModel | undefined {
        return this.lobbies.find((l) => l.lobbyId === id);
    }
    public create(options: CreateLobbyDto): LobbyModel {
        const lobby: LobbyModel = {
            lobbyId: uuidv4(),
            players: [options.ownerId],
            private: options.private,
        };
        return lobby;
    }
    public delete(id: string): boolean {
        const lobbyIndex = this.lobbies.findIndex((l) => l.lobbyId === id);
        if (lobbyIndex >= 0) {
            this.lobbies.splice(lobbyIndex, 1);
            return true;
        }
        return false;
    }
}
