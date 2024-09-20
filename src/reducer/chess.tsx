import {
  GameState,
  Board,
  Color,
  Piece,
  Row,
  Cell,
  PieceKind,
} from "@/pb/game";
import {
  Dispatch,
  useReducer,
  useContext,
  createContext,
  useState,
  SetStateAction,
} from "react";
import { EdgeAction, useEdgeReducerV0 } from "@turbo-ing/edge-v0";

interface MoveAction extends EdgeAction<GameState> {
  type: "MOVE";
  payload: {
    from: { row: number; col: number };
    to: { row: number; col: number };
  };
}

interface JoinAction extends EdgeAction<GameState> {
  type: "JOIN";
  payload: {
    name: string;
  };
}

// Action Types
type Action = MoveAction | JoinAction;

// Reducer Function
const chessReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case "MOVE": {
      const { from, to } = action.payload;
      const board = state.board;

      if (!board) {
        throw new Error("Board not initialized");
      }

      if (state.turn == Color.WHITE && action.peerId != state.whitePlayer) {
        throw new Error("Not your turn");
      }

      if (state.turn == Color.BLACK && action.peerId != state.blackPlayer) {
        throw new Error("Not your turn");
      }

      const movingPiece = board.rows[from.row]?.cells[from.col]?.piece;

      if (!movingPiece) {
        throw new Error("No piece at source position");
      }

      if (movingPiece.color !== state.turn) {
        throw new Error("Not your turn");
      }

      // Validate move
      if (!validateMove(movingPiece, from, to, board)) {
        throw new Error("Invalid move");
      }

      // Deep copy of the board to maintain immutability
      const newBoard = JSON.parse(JSON.stringify(board)) as Board;

      // Perform the move
      newBoard.rows[from.row].cells[from.col].piece = undefined;
      newBoard.rows[to.row].cells[to.col].piece = movingPiece;

      // Switch turn
      const nextTurn = state.turn === Color.WHITE ? Color.BLACK : Color.WHITE;

      return {
        ...state,
        turn: nextTurn,
        board: newBoard,
      };
    }

    case "JOIN": {
      if (!state.whitePlayer) {
        return {
          ...state,
          whitePlayer: action.peerId!,
        };
      } else if (!state.blackPlayer) {
        return {
          ...state,
          whitePlayer: action.peerId!,
        };
      } else {
        throw new Error("Room is full");
      }
    }

    default:
      return state;
  }
};

// Move Validation Function
function validateMove(
  piece: Piece,
  from: { row: number; col: number },
  to: { row: number; col: number },
  board: Board,
): boolean {
  const deltaRow = to.row - from.row;
  const deltaCol = to.col - from.col;

  const targetCell = board.rows[to.row]?.cells[to.col];
  if (!targetCell) {
    // Target position is off the board
    return false;
  }

  // Cannot capture own piece
  if (targetCell.piece && targetCell.piece.color === piece.color) {
    return false;
  }

  const direction = piece.color === Color.WHITE ? -1 : 1;

  switch (piece.kind) {
    case PieceKind.PAWN: {
      // Move forward
      if (deltaCol === 0) {
        // One square forward
        if (deltaRow === direction && !targetCell.piece) {
          return true;
        }
        // Two squares forward from starting position
        const startRow = piece.color === Color.WHITE ? 6 : 1;
        if (
          deltaRow === 2 * direction &&
          from.row === startRow &&
          !targetCell.piece
        ) {
          const intermediateRow = from.row + direction;
          const intermediateCell = board.rows[intermediateRow]?.cells[from.col];
          if (!intermediateCell.piece) {
            return true;
          }
        }
      }
      // Diagonal capture
      if (
        Math.abs(deltaCol) === 1 &&
        deltaRow === direction &&
        targetCell.piece &&
        targetCell.piece.color !== piece.color
      ) {
        return true;
      }
      return false;
    }
    case PieceKind.ROOK: {
      if (deltaRow === 0 || deltaCol === 0) {
        if (isPathClear(board, from, to)) {
          return true;
        }
      }
      return false;
    }
    case PieceKind.BISHOP: {
      if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
        if (isPathClear(board, from, to)) {
          return true;
        }
      }
      return false;
    }
    case PieceKind.QUEEN: {
      if (
        deltaRow === 0 ||
        deltaCol === 0 ||
        Math.abs(deltaRow) === Math.abs(deltaCol)
      ) {
        if (isPathClear(board, from, to)) {
          return true;
        }
      }
      return false;
    }
    case PieceKind.KNIGHT: {
      if (
        (Math.abs(deltaRow) === 2 && Math.abs(deltaCol) === 1) ||
        (Math.abs(deltaRow) === 1 && Math.abs(deltaCol) === 2)
      ) {
        return true;
      }
      return false;
    }
    case PieceKind.KING: {
      if (Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1) {
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

// Helper Function to Check if Path is Clear
function isPathClear(
  board: Board,
  from: { row: number; col: number },
  to: { row: number; col: number },
): boolean {
  const deltaRow = to.row - from.row;
  const deltaCol = to.col - from.col;

  const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
  const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);

  let currentRow = from.row + stepRow;
  let currentCol = from.col + stepCol;

  while (currentRow !== to.row || currentCol !== to.col) {
    const cell = board.rows[currentRow]?.cells[currentCol];
    if (cell?.piece) {
      return false; // Path is blocked
    }
    currentRow += stepRow;
    currentCol += stepCol;
  }
  return true; // Path is clear
}

// Initialize the board with starting positions
function initializeBoard(): Board {
  const rows: Row[] = [];

  for (let row = 0; row < 8; row++) {
    const cells: Cell[] = [];

    for (let col = 0; col < 8; col++) {
      let piece: Piece | undefined = undefined;

      if (row === 1) {
        piece = { color: Color.BLACK, kind: PieceKind.PAWN };
      } else if (row === 6) {
        piece = { color: Color.WHITE, kind: PieceKind.PAWN };
      } else if (row === 0 || row === 7) {
        const color = row === 0 ? Color.BLACK : Color.WHITE;
        const kinds: PieceKind[] = [
          PieceKind.ROOK,
          PieceKind.KNIGHT,
          PieceKind.BISHOP,
          PieceKind.QUEEN,
          PieceKind.KING,
          PieceKind.BISHOP,
          PieceKind.KNIGHT,
          PieceKind.ROOK,
        ];
        piece = { color, kind: kinds[col] };
      }

      cells.push({ piece });
    }

    rows.push({ cells });
  }

  return { rows };
}

// Create Context
const ChessContext = createContext<
  | [GameState, Dispatch<Action>, boolean, Dispatch<SetStateAction<string>>]
  | null
>(null);

// Provider Component
export const ChessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [room, setRoom] = useState("");

  const initialState: GameState = {
    turn: Color.WHITE,
    whitePlayer: "",
    blackPlayer: "",
    board: initializeBoard(),
  };

  const [state, dispatch, connected] = useEdgeReducerV0(
    chessReducer,
    initialState,
    {
      topic: room ? `turbo-chess-${room}` : "",
    },
  );

  return (
    <ChessContext.Provider value={[state, dispatch, connected, setRoom]}>
      {children}
    </ChessContext.Provider>
  );
};

// Custom Hook
export const useChess = () => {
  const context = useContext(ChessContext);
  if (!context) {
    throw new Error("useChess must be used within a ChessProvider");
  }
  return context;
};
