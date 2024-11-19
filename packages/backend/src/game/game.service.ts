import { Injectable, NotImplementedException } from "@nestjs/common";
import { IsNull, LessThan, Not, Or, Repository } from "typeorm";
import { GameEntity } from "./game.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { GameState, FieldGraphEdge, range, FieldGraphVertex } from "@swipesoccer/common";
import deepcopy from "deepcopy";
import { PlayerService } from "../player/player.service";
import { produce } from "immer";

@Injectable()
export class GameService {
    constructor(
        @InjectRepository(GameEntity) private readonly gamesRepository: Repository<GameEntity>,
        private readonly playersService: PlayerService,
    ) {}

    public createGame(playerId: string): Promise<GameEntity> {
        const game = this.gamesRepository.create({
            host: { id: playerId },
            players: [{ id: playerId }],
        });

        return this.gamesRepository.save(game);
    }

    public async joinGameById(playerId: string, gameId: string): Promise<GameEntity | null> {
        const game = await this.findGameById(gameId);
        if (!game) return null;

        if (game.players.length < game.maxPlayers) {
            await this.gamesRepository.createQueryBuilder().relation(GameEntity, "players").of(gameId).add(playerId);
        }
        return await this.findGameById(gameId);
    }

    public async isInTurn(gameId: string, playerId: string): Promise<boolean> {
        const game = await this.findGameById(gameId);
        if (!game || !game.state) return false;

        const index = game.players.findIndex((p) => p.id === playerId);
        return game.state.playerInTurn === index;
    }

    public async purgeIfInactive(gameId: string) {
        const game = await this.findGameById(gameId);
        if (!game || !game.state) return false;

        if (game.players.every((p) => !p.connectedSocketId)) {
            await this.gamesRepository.delete({
                id: game.id,
            });
        }
    }

    public async kickBall(gameId: string, playerId: string, target: number): Promise<boolean> {
        console.log(`${gameId}: ${playerId} kicked ball to ${target}`);

        const game = await this.findGameById(gameId);
        if (!game || !game.state) return false;

        const index = game.players.findIndex((p) => p.id === playerId);
        const [u, v] = [game.state.ballPosition, target].sort((a, b) => a - b);
        console.log(u, v, game.state.edgeMatrix[u][v]);
        if (!game.state.edgeMatrix[u][v] || game.state.edgeMatrix[u][v] >= 0) return false;

        const [ballRow, ballCol] = indexToPos(game.state.ballPosition);
        const [targetRow, targetCol] = indexToPos(target);
        if ((ballCol === 0 || ballCol === 6) && ballCol === targetCol) return false;

        await this.gamesRepository.update(gameId, {
            state: produce(game.state, (draft) => {
                const [u, v] = [draft.ballPosition, target].sort();
                draft.edgeMatrix[u][v] = index;
                draft.ballPosition = target;

                if (!draft.activeVertices[target]) {
                    draft.playerInTurn = (draft.playerInTurn + 1) % draft.players.length;
                }

                draft.activeVertices[target] = true;
            }),
        });

        return true;
    }

    public async findAvailableGameId(): Promise<string | null> {
        const games = await this.gamesRepository.find({ relations: { players: true } });
        for (const game of games) {
            if (game.players.length < game.maxPlayers) {
                return game.id;
            }
        }
        return null;
    }

    public async findGameById(gameId: string): Promise<GameEntity | null> {
        return this.gamesRepository.findOne({
            where: { id: gameId },
            relations: {
                players: true,
            },
        });
    }

    public async canStartGame(gameId: string): Promise<boolean> {
        const game = await this.findGameById(gameId);
        return !!game && !game.state && game.players.length >= game.maxPlayers;
    }

    public async startGame(gameId: string): Promise<void> {
        const game = await this.findGameById(gameId);
        if (!game) return;

        const removedVertices = [7, 7 + 6, 7 * 9, 7 * 9 + 6];

        const edgeMatrix: FieldGraphEdge[][] = range(7 * 11).map((u) =>
            range(7 * 11).map((v) => {
                if (u >= v) return null;

                const [uRow, uCol] = indexToPos(u);
                const [vRow, vCol] = indexToPos(v);

                const rowDiff = Math.abs(uRow - vRow);
                const colDiff = Math.abs(uCol - vCol);

                if (rowDiff > 1 || colDiff > 1) return null;
                if ([u, v].some((i) => removedVertices.includes(i))) return null;

                if (vRow === 0 || vRow === 10 || uRow === 0 || uRow === 10) return null;

                return -1;
            }),
        );

        range(3).forEach((i) => (edgeMatrix[3][9 + i] = -1));
        range(3).forEach((i) => (edgeMatrix[7 * 9 + 2 + i][7 * 10 + 3] = -1));

        const activeVertices: FieldGraphVertex[] = range(7 * 11).map((i) => {
            const [row, col] = indexToPos(i);

            if (removedVertices.includes(i)) return null;

            if (col === 0 || col === 6) return true;
            if (row === 1 && col !== 3) return true;
            if (row === 9 && col !== 3) return true;

            return false;
        });

        const ballPosition = 5 * 7 + 3;
        activeVertices[ballPosition] = true;

        await this.gamesRepository.update(game.id, {
            state: {
                activeVertices,
                edgeMatrix,
                ballPosition,
                playerInTurn: 0,
                players: game.players.map(this.playersService.playerToDto),
            },
        });
    }

    public gameToDto(game: GameEntity): GameState | null {
        return game.state;
    }

    //     const game = await this.gamesRepository
    //         .createQueryBuilder("game")
    //         .leftJoinAndSelect("game.players", "player")
    //         .groupBy("player.id")
    //         .having("COUNT(player.id) < game.maxPlayers")
    //         .getOne();

    //     return game?.id || null;

    //     throw new NotImplementedException();

    //     // const entities = await this.gamesRepository.find({
    //     //     where: {
    //     //         state: IsNull()
    //     //     },
    //     // });

    //     // for (const entity of entities) {
    //     //     if (entity.players.length < )
    //     // }

    //     // return entities;
    // }

    // public async find(id: number): Promise<GameEntity | null> {
    //     return await this.gamesRepository.findOne({ where: { id } });
    // }

    // public async findActiveGameId(playerId: number): Promise<number | null> {
    //     const player = await this.playersService.find(playerId);

    //     if (player && player.activeGame) {
    //         return player.activeGame.id;
    //     }

    //     return null;
    // }

    // public async leaveActiveGame(playerId: number): Promise<boolean> {
    //     console.log("player " + playerId + " wants to leave");

    //     const game = await this.gamesRepository
    //         .createQueryBuilder("game")
    //         .leftJoinAndSelect("game.players", "player")
    //         .having("COUNT(player.id) < game.maxPlayers")
    //         .getOne();

    //     throw new NotImplementedException();
    //     // const game = await this.findActiveGame(player);

    //     // if (game) {
    //     //     if (game.host === player) {
    //     //         if (game.guest) {
    //     //             await this.gamesRepository.update(game.id, {
    //     //                 host: game.guest,
    //     //                 guest: null,
    //     //             });
    //     //         } else {
    //     //             await this.gamesRepository.delete(game.id);
    //     //         }
    //     //     } else {
    //     //         await this.gamesRepository.update(game.id, {
    //     //             guest: null,
    //     //         });
    //     //     }

    //     //     return true;
    //     // }

    //     // return false;
    // }
}

function mapMatrix<A, B>(matrix: A[][], mapper: (el: A, i: number, j: number) => B) {
    return matrix.map((colItems, col) => colItems.map((el, row) => mapper(el, row, col)));
}

function indexToPos(i: number): [number, number] {
    return [Math.floor(i / 7), i % 7];
}
