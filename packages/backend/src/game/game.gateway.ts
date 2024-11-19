import { Logger, OnModuleDestroy } from "@nestjs/common";
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from "@nestjs/websockets";
import { GameState, FieldGraphEdge, range, GamePlayer } from "@swipesoccer/common";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";
import { GameEntity } from "./game.entity";
import { PlayerService } from "../player/player.service";

@WebSocketGateway(3001, {
    cors: true,
})
export class GameGateway implements OnGatewayInit<Server>, OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket> {
    private readonly logger = new Logger(GameGateway.name);

    constructor(
        private readonly gameService: GameService,
        private readonly playersService: PlayerService,
    ) {}

    @WebSocketServer() public io: Server;

    async afterInit() {
        this.logger.log("Initialized game gateway.");
    }

    async handleConnection(client: Socket) {}

    async handleDisconnect(client: Socket) {
        const player = await this.playersService.findPlayerBySocket(client.id);
        if (!player) return;

        await this.playersService.disconnectPlayerBySocket(client.id);

        const game = await this.playersService.getActiveGame(player.id);
        if (game) {
            await this.gameService.purgeIfInactive(game.id);
        }

        return;
    }

    @SubscribeMessage("register")
    async register(@MessageBody() token: string, @ConnectedSocket() client: Socket): Promise<GamePlayer> {
        const player = await this.playersService.connectPlayerBySocket(client.id, token);

        let activeGame = await this.playersService.getActiveGame(player.id);
        if (!activeGame) {
            const availableGameId = await this.gameService.findAvailableGameId();
            if (availableGameId) {
                activeGame = (await this.gameService.joinGameById(player.id, availableGameId))!;
            } else {
                activeGame = await this.gameService.createGame(player.id);
            }
        }

        const gameSocketRoom = this.getGameRoomId(activeGame);

        await client.join(gameSocketRoom);

        if (await this.gameService.canStartGame(activeGame.id)) {
            await this.gameService.startGame(activeGame.id);
        }

        activeGame = (await this.gameService.findGameById(activeGame.id))!;
        this.io.to(gameSocketRoom).emit("updateState", this.gameService.gameToDto(activeGame));

        return this.playersService.playerToDto(player);
    }

    @SubscribeMessage("playMove")
    async playMove(@MessageBody() { name, data }: { name: string; data: any }, @ConnectedSocket() client: Socket) {
        const player = await this.playersService.findPlayerBySocket(client.id);
        if (!player) return;

        let game = await this.playersService.getActiveGame(player.id);
        if (!game) return;

        if (!(await this.gameService.isInTurn(game.id, player.id))) return;

        if (name === "kickBall") {
            const { target } = data as {
                target: number;
            };

            const result = await this.gameService.kickBall(game.id, player.id, target);
            if (result) {
                game = (await this.gameService.findGameById(game.id))!;

                const gameSocketRoom = this.getGameRoomId(game);
                this.io.to(gameSocketRoom).emit("updateState", this.gameService.gameToDto(game!));
            }
        }
    }

    private getGameRoomId(game: GameEntity): string {
        return "game-" + game.id;
    }
}
