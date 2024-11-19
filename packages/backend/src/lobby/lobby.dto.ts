import { PlayerDto } from "src/player/player.dto";

export class LobbyDto {
    lobbyId: string;
    private: boolean;
    players: PlayerDto[];
}

export class JoinLobbyDto {
    playerId: string;
}

export class CreateLobbyDto {
    ownerId: string;
    private: boolean;
}

export class UpdateLobbyDto {
    private: boolean;
}

export class UpdatePlayerInLobbyDto {}
