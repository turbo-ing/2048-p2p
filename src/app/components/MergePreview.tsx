import { MergeEvent } from "@/reducer/2048";
import { Tile } from "./Tile";
import { Tile as TileType } from "@/reducer/2048";

interface MergePreviews {
  merges: MergeEvent[];
  cellSize: number;
  gap: number;
}

export const MergePreview: React.FC<MergePreviews> = ({
  merges,
  cellSize,
  gap,
}) => {
  return (
    <>
      {merges.map((merge) => {
        const { to, tile1, tile2 } = merge;
        if (!to) {
          throw Error("to is undefined, unable to build preview");
        }
        const from1: TileType = {
          id: crypto.randomUUID(),
          value: merge.value,
          isNew: false,
          isMerging: false,
          x: to!.x,
          y: to!.y,
          prevX: tile1.startX,
          prevY: tile1.startY,
        };

        const from2: TileType = {
          id: crypto.randomUUID(),
          value: merge.value,
          isNew: false,
          isMerging: false,
          x: to!.x,
          y: to!.y,
          prevX: tile2.startX,
          prevY: tile2.startY,
        };

        return (
          <>
            <Tile
              key={merge.tileId + "1"}
              tile={from1}
              cellSize={cellSize}
              gap={gap}
              style={{ zIndex: 1 }}
            />
            <Tile
              key={merge.tileId + "2"}
              tile={from2}
              cellSize={cellSize}
              gap={gap}
              style={{ zIndex: 1 }}
            />
          </>
        );
      })}
    </>
  );
};
