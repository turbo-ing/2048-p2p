import { useRef, useEffect } from "react";
import { MergeEvent, Tile as TileType } from "../../reducer/2048";
import classNames from "classnames";
import { BASE_ANIMATION_SPEED } from "../../../tailwind.config";

function getTileStyle(tile: TileType | null) {
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

  return styles[tile.value] ?? { backgroundColor: "#3c3a32", color: "#f9f6f2" };
}

interface TileProps {
  tile: TileType;
  isEphemeral?: boolean;
  cellSize: number;
  gap: number;
  fontSize?: number; // Add fontSize as a prop
  style?: React.CSSProperties;
}

export const Tile: React.FC<TileProps> = ({
  tile,
  cellSize,
  gap,
  fontSize,
  style,
}) => {
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tileRef.current;
    if (!el) return;

    // Use prevX/prevY if available, otherwise fall back to current
    const startX = tile.prevX ?? tile.x;
    const startY = tile.prevY ?? tile.y;

    // Immediately position the tile at its START position (no transition).
    el.style.transition = "none";
    el.style.transform = `translate(${startX * (cellSize + gap)}px, ${
      startY * (cellSize + gap)
    }px)`;

    // Force reflow (so the browser actually applies the above transform).
    void el.offsetHeight;

    // If the tile has actually moved, animate to the new position.
    if (startX !== tile.x || startY !== tile.y) {
      el.style.transition = `transform ${BASE_ANIMATION_SPEED}s ease-in-out`;
      el.style.transform = `translate(${tile.x * (cellSize + gap)}px, ${
        tile.y * (cellSize + gap)
      }px)`;
    } else {
      // No movement => no transition needed
      el.style.transition = "none";
    }
  }, [tile, cellSize, gap]);

  return (
    <div
      ref={tileRef}
      className="absolute z-10"
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        ...style,
      }}
    >
      <div
        className={classNames(
          "rounded-md w-full h-full flex items-center justify-center z-10 font-semibold",
          {
            "animate-newTile": tile.isNew,
            "animate-mergeTile": tile.isMerging,
          },
        )}
        style={{
          ...getTileStyle(tile),
          fontSize: `${fontSize}px`, // Use the dynamic font size here
        }}
      >
        <span>{tile.value}</span>
      </div>
    </div>
  );
};
