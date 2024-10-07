// "use client";
//
// import { useCallback } from "react";
// import { ThemeProvider } from "styled-components";
//
// import { Navbar } from "@/app/components/Navbar";
// import GameBoard from "@/app/components/GameBoard";
// import { GRID_SIZE, MIN_SCALE, SPACING } from "@/utils/constants";
// import useGameBoard from "@/app/hooks/useGameBoard";
// import useGameState, { GameStatus } from "@/app/hooks/useGameState";
// import useGameScore from "@/app/hooks/useGameScore";
// import useLocalStorage from "@/app/hooks/useLocalStorage";
// import { ThemeName } from "@/app/themes/types";
// import useTheme from "@/app/hooks/useTheme";
// import ScoreBoard from "@/app/components/ScoreBoard";
//
// export type Configuration = {
//   theme: ThemeName;
//   bestScore: number;
//   rows: number;
//   cols: number;
// };
//
// const APP_NAME = "2048-p2p";
//
// export default function GamePlay() {
//   const [config, setConfig] = useLocalStorage<Configuration>(APP_NAME, {
//     theme: "dark",
//     bestScore: 0,
//     rows: MIN_SCALE,
//     cols: MIN_SCALE,
//   });
//   const [{ name: themeName, value: themeValue }, setTheme] = useTheme(
//     config.theme,
//   );
//   const [gameState, setGameStatus] = useGameState({
//     status: "running",
//     pause: false,
//   });
//   const { total, best, addScore, setTotal } = useGameScore(config.bestScore);
//
//   const move = useCallback(async (dir: "u" | "d" | "l" | "r") => {
//     console.log("Move", dir);
//   }, []);
//
//   const addTile = useCallback(async (r: number, c: number) => {
//     console.log("Add Tile", r, c);
//   }, []);
//
//   const { tiles, grid, onMove, onMovePending, onMergePending } = useGameBoard({
//     rows: 4,
//     cols: 4,
//     gameState,
//     gameStarted: true,
//     addScore,
//     move,
//     addTile,
//   });
//   const onCloseNotification = useCallback(
//     (currentStatus: GameStatus) => {
//       setGameStatus(currentStatus === "win" ? "continue" : "restart");
//     },
//     [setGameStatus],
//   );
//
//   return (
//     <div>
//       <ThemeProvider theme={themeValue}>
//         <Navbar isDark={true} isShowButton={true} />
//         <main className="absolute inset-0 w-full h-full text-white text-4xl transition-opacity duration-1000 lg:pt-20">
//           <div
//             className="h-full"
//             style={{
//               backgroundImage: "url('/img/2048_home_bg.png')",
//               backgroundSize: "cover",
//               backgroundRepeat: "no-repeat",
//             }}
//           >
//             <div className="flex flex-col justify-center items-center h-full">
//               <div className="mb-6">
//                 <ScoreBoard title="Score" total={total} />
//               </div>
//
//               <GameBoard
//                 boardSize={GRID_SIZE}
//                 cols={4}
//                 gameStatus={gameState.status}
//                 rows={4}
//                 spacing={SPACING}
//                 tiles={tiles}
//                 onCloseNotification={onCloseNotification}
//                 onMergePending={onMergePending}
//                 onMove={onMove}
//                 onMovePending={onMovePending}
//               />
//             </div>
//           </div>
//         </main>
//       </ThemeProvider>
//     </div>
//   );
// }
