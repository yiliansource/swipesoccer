import { Line, Text } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { GameState } from "@swipesoccer/common";
import { useCallback, useEffect, useState } from "react";
import * as THREE from "three";
import { range } from "@swipesoccer/common/src/helper";
import deepcopy from "deepcopy";
import { useImmer } from "use-immer";
import { useSpring, animated, config } from "@react-spring/three";
import { useSwipeable } from "react-swipeable";
import { socket } from "../socket";

export interface BoardProps {
    game: GameState;
}

export function Board({ game }: BoardProps) {
    const { scene, camera } = useThree();

    useEffect(() => {
        camera.position.set(0, 10, 0);
        camera.rotation.set(-Math.PI / 2, 0, 0);
    }, [camera]);

    const [ballRow, ballCol] = indexToPos(game.ballPosition);

    const { position } = useSpring({
        position: [ballCol - 3, 1.25, ballRow - 5],
        config: {
            ...config.default,
            duration: 200,
        },
    });

    const { ref } = useSwipeable({
        onSwiped: (eventData) => {
            const v = new THREE.Vector2(eventData.deltaX, eventData.deltaY).normalize();
            v.set(Math.round(v.x), Math.round(v.y));

            const target = game.ballPosition + v.x + v.y * 7;
            if (game.edgeMatrix[game.ballPosition][target] !== -1 && game.edgeMatrix[target][game.ballPosition] !== -1)
                return;

            kickBall(target);
        },
        ...config,
    });

    useEffect(() => {
        ref(document.body);
        return () => ref(null);
    }, []);

    const kickBall = useCallback(
        (target: number) => {
            if (target === game.ballPosition) return;

            const [targetRow, targetCol] = indexToPos(target);

            const rowDiff = Math.abs(ballRow - targetRow);
            const colDiff = Math.abs(ballCol - targetCol);

            if (rowDiff > 1 || colDiff > 1) return;

            socket.emit("playMove", {
                name: "kickBall",
                data: {
                    target,
                },
            });
        },
        [game.ballPosition],
    );

    return (
        <group>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[7, 1, 11]} />
                <meshLambertMaterial color={new THREE.Color("#c5cdf1")} />
            </mesh>

            <animated.mesh position={position}>
                <sphereGeometry args={[0.25]} />
                <meshPhysicalMaterial color="gray" />
            </animated.mesh>

            {game.activeVertices.map((e, i) => {
                const [row, col] = indexToPos(i);

                if ((row === 0 || row === 10) && col !== 3) {
                    return null;
                }

                return (
                    <group key={i} position={[col - 3, 1, row - 5]}>
                        <mesh castShadow receiveShadow>
                            <cylinderGeometry args={[0.15, 0.15, 0.1]} />
                            <meshLambertMaterial color={e ? "yellow" : "white"} />
                        </mesh>
                        <mesh onClick={() => kickBall(i)} visible={false}>
                            <sphereGeometry args={[0.5]} />
                        </mesh>
                        {/* <Text fontSize={0.15} color={"black"} position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            {i}
                        </Text> */}
                    </group>
                );
            })}
            {mapMatrix(game.edgeMatrix, (e, u, v) => {
                if (e === null) return null;

                const [uRow, uCol] = indexToPos(u);
                const [vRow, vCol] = indexToPos(v);

                if (e < 0) {
                    <Line
                        key={u + ", " + v}
                        points={[new THREE.Vector3(uCol - 3, 1, uRow - 5), new THREE.Vector3(vCol - 3, 1, vRow - 5)]}
                        color={"green"}
                        lineWidth={2}
                    />;
                }

                return (
                    <Line
                        key={u + ", " + v}
                        points={[new THREE.Vector3(uCol - 3, 1, uRow - 5), new THREE.Vector3(vCol - 3, 1, vRow - 5)]}
                        color={["red", "blue"][e]}
                        lineWidth={5}
                    />
                );
            })}
        </group>
    );
}

function mapMatrix<A, B>(matrix: A[][], mapper: (el: A, i: number, j: number) => B) {
    return matrix.map((colItems, col) => colItems.map((el, row) => mapper(el, row, col)));
}

function indexToPos(i: number): [number, number] {
    return [Math.floor(i / 7), i % 7];
}
