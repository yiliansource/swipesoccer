import { Injectable } from "@nestjs/common";
import { PlayerEntity } from "./player.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GamePlayer } from "@swipesoccer/common";
import { GameEntity } from "src/game/game.entity";

@Injectable()
export class PlayerService {
    constructor(@InjectRepository(PlayerEntity) private readonly playerRepository: Repository<PlayerEntity>) {}

    public async find(id: string): Promise<PlayerEntity | null> {
        return await this.playerRepository.findOne({ where: { id } });
    }

    public async findPlayerById(id: string): Promise<PlayerEntity | null> {
        return await this.playerRepository.findOne({ where: { id }, relations: { activeGame: true } });
    }
    public async findPlayerByToken(token: string): Promise<PlayerEntity | null> {
        return await this.playerRepository.findOne({ where: { token } });
    }
    public async findPlayerBySocket(socketId: string): Promise<PlayerEntity | null> {
        return await this.playerRepository.findOne({ where: { connectedSocketId: socketId } });
    }

    public async getActiveGame(playerId: string): Promise<GameEntity | null> {
        const player = await this.findPlayerById(playerId);
        if (!player || !player.activeGame) return null;
        return player.activeGame;
    }

    public async connectPlayerBySocket(socketId: string, token: string, defaultName = "Guest"): Promise<PlayerEntity> {
        let player = await this.findPlayerByToken(token);
        if (!player) {
            player = this.playerRepository.create({
                token,
                name: defaultName,
            });
        }
        player.connectedSocketId = socketId;
        return await this.playerRepository.save(player);
    }
    public async disconnectPlayerBySocket(socketId: string): Promise<void> {
        let player = await this.findPlayerBySocket(socketId);
        if (player) {
            player.connectedSocketId = null;
            await this.playerRepository.save(player);
        }
    }

    public playerToDto(player: PlayerEntity): GamePlayer {
        return {
            id: player.id,
            name: player.name,
        };
    }
}
