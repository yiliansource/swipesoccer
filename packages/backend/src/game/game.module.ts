import { Module } from "@nestjs/common";
import { GameGateway } from "./game.gateway";
import { GameService } from "./game.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameEntity } from "./game.entity";
import { PlayerModule } from "../player/player.module";

@Module({
    imports: [TypeOrmModule.forFeature([GameEntity]), PlayerModule],
    providers: [GameGateway, GameService],
})
export class GameModule {}
