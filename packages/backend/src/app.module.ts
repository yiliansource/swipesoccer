import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LobbyModule } from "./lobby/lobby.module";
import { GameModule } from "./game/game.module";
import { PlayerModule } from "./player/player.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlayerEntity } from "./player/player.entity";
import { GameEntity } from "./game/game.entity";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "mysql",
            host: "localhost",
            port: 3306,
            username: "root",
            password: "root",
            database: "swipesoccer",
            entities: [PlayerEntity, GameEntity],
            synchronize: true,
        }),
        GameModule,
        PlayerModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
