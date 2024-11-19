import { GameState } from "@swipesoccer/common";
import { PlayerEntity } from "../player/player.entity";
import {
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class GameEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "json", nullable: true })
    state: GameState | null;

    @OneToOne(() => PlayerEntity, { onDelete: "SET NULL" })
    @JoinColumn()
    host: PlayerEntity;

    @OneToMany(() => PlayerEntity, (player) => player.activeGame)
    players: PlayerEntity[];

    @Column({ type: "int", default: 2 })
    maxPlayers: number;
}
