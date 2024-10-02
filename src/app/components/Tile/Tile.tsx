import React, { FC } from "react";

import StyledTile, { StyledTileProps } from "./StyledTile";
import StyledTileValue from "./StyledTileValue";

export interface TileProps extends StyledTileProps {
  isNew?: boolean;
  isMerging?: boolean;
}

const Tile: FC<TileProps> = ({
  value,
  x,
  y,
  width,
  height,
  isNew = false,
  isMerging = false,
}) => (
  <StyledTile height={height} value={value} width={width} x={x} y={y}>
    <StyledTileValue isMerging={isMerging} isNew={isNew} value={value}>
      {value}
    </StyledTileValue>
  </StyledTile>
);

export default Tile;
