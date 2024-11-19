export type FieldGraphEdge = number | null;
export type FieldGraphVertex = boolean | null;

export interface GameState {
    activeVertices: FieldGraphVertex[];
    edgeMatrix: FieldGraphEdge[][];
    ballPosition: number;
    playerInTurn: number;
    players: GamePlayer[];
}

export interface GamePlayer {
    id: string;
    name: string;
}
