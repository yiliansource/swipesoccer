import { GameEntity } from "../game/game.entity";
import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PlayerEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    token: string;

    @Column({ type: "text" })
    name: string;

    @Column({ type: "varchar", length: 36, nullable: true })
    connectedSocketId: string | null;

    @ManyToOne(() => GameEntity, (game) => game.players, { nullable: true, onDelete: "CASCADE" })
    activeGame?: GameEntity | null;
}
