import { Environment, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Toaster } from "react-hot-toast";
import { Board } from "./components/board";
import * as THREE from "three";
import { useEffect, useState } from "react";
import { socket } from "./socket";
import { GamePlayer, GameState } from "@swipesoccer/common";
import { useAtom } from "jotai";
import { deviceTokenAtom, gameStateAtom, playerAtom } from "./atoms";

function App() {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [player, setPlayer] = useAtom(playerAtom);
    const [deviceToken] = useAtom(deviceTokenAtom);

    useEffect(() => {
        function onConnect() {
            console.log("Registering ...");
            socket.emitWithAck("register", deviceToken).then((player: GamePlayer) => {
                setPlayer(player);
            });
        }
        function onDisconnect() {
            setPlayer(null);
        }
        function updateState(gameState: GameState) {
            console.log(gameState);
            setGameState(gameState);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("updateState", updateState);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("updateState", updateState);

            socket.disconnect();
        };
    }, []);

    return (
        <>
            <div className="fixed z-10 text-white bg-black/50 p-4">
                <p>isRegistered: {!!player ? "true" : "false"}</p>
                <p>deviceToken: {deviceToken}</p>
                <p>socketId: {socket.id}</p>
                {!!player && !!gameState && (
                    <p>
                        isTurn:{" "}
                        {gameState.playerInTurn === gameState.players.findIndex((p) => p.id === player.id)
                            ? "true"
                            : "false"}
                    </p>
                )}
            </div>

            {!player && (
                <div className="flex h-screen w-screen">
                    <div className="m-auto">
                        <button onClick={() => socket.connect()}>Quickplay!</button>
                    </div>
                </div>
            )}
            {!!player && !gameState && (
                <div className="flex h-screen w-screen">
                    <div className="m-auto">
                        <p>Waiting for game ...</p>
                    </div>
                </div>
            )}
            {!!player && !!gameState && (
                <div className="absolute top-0 left-0 w-screen h-screen">
                    <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                        <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
                            <planeGeometry args={[50, 50, 10, 10]} />
                            <meshLambertMaterial color={new THREE.Color("#4c4b69")} side={THREE.DoubleSide} />
                        </mesh>

                        {/* <OrbitControls /> */}
                        {/* <OrthographicCamera makeDefault /> */}
                        <Board game={gameState} />

                        {/* <Environment preset="city" background blur={1} /> */}
                        <ambientLight intensity={Math.PI / 2} />
                        <directionalLight position={[-5, 5, -5]} castShadow />
                    </Canvas>
                </div>
            )}

            <Toaster />
        </>
    );
}

export default App;
