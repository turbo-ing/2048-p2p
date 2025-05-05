import { useRef, useEffect } from "react";
import { MergeEvent, Tile as TileType } from "../../reducer/2048";
import classNames from "classnames";
import { BASE_ANIMATION_SPEED } from "../../../tailwind.config";

function getTileStyle(tile: number) {
  if (!tile) {
    return { backgroundColor: "#cdc1b4", color: "#776e65" };
  }

  const styles: Record<number, { backgroundColor: string; color: string }> = {
    2: { backgroundColor: "#eee4da", color: "#776e65" },
    4: { backgroundColor: "#ede0c8", color: "#776e65" },
    8: { backgroundColor: "#f2b179", color: "#f9f6f2" },
    16: { backgroundColor: "#f59563", color: "#f9f6f2" },
    32: { backgroundColor: "#f67c5f", color: "#f9f6f2" },
    64: { backgroundColor: "#f65e3b", color: "#f9f6f2" },
    128: { backgroundColor: "#edcf72", color: "#f9f6f2" },
    256: { backgroundColor: "#edcc61", color: "#f9f6f2" },
    512: { backgroundColor: "#edc850", color: "#f9f6f2" },
    1024: { backgroundColor: "#edc53f", color: "#f9f6f2" },
    2048: { backgroundColor: "#edc22e", color: "#f9f6f2" },
  };

  return styles[tile] ?? { backgroundColor: "#3c3a32", color: "#f9f6f2" };
}

interface TileProps {
  tile: number;
  isEphemeral?: boolean;
  cellSize: number;
  gap: number;
  fontSize?: number; // Add fontSize as a prop
  style?: React.CSSProperties;
}

export const TileMinimal: React.FC<TileProps> = ({
  tile,
  cellSize,
  gap,
  fontSize,
  style,
}) => {
  return (
    <div
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        ...style,
      }}
    >
      <div
        className={classNames(
          "rounded-md w-full h-full flex items-center justify-center z-10 font-semibold",
        )}
        style={{
          ...getTileStyle(tile),
          fontSize: `${fontSize}px`, // Use the dynamic font size here
        }}
      >
        <span>{tile}</span>
      </div>
    </div>
  );
};
