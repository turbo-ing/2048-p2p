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

interface LeaveAction extends EdgeAction<GameState> {
  type: "LEAVE";
}

// Action Types
type Action = MoveAction | JoinAction | LeaveAction;

function error(message: string) {
  console.error(message);
}

// Reducer Function
const chessReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case "MOVE": {
      const { from, to } = action.payload;
      const board = state.board;

      if (!board) {
        error("Board not initialized");
        return state;
      }

      if (!state.whitePlayer || !state.blackPlayer) {
        error("Opponent hasn't joined yet");
        return state;
      }

      if (typeof state.winner !== "undefined") {
        error("Game has ended");
        return state;
      }

      if (state.turn == Color.WHITE && action.peerId != state.whitePlayer) {
        error("Not your turn");
        return state;
      }

      if (state.turn == Color.BLACK && action.peerId != state.blackPlayer) {
        error("Not your turn");
        return state;
      }

      const movingPiece = board.rows[from.row]?.cells[from.col]?.piece;

      if (!movingPiece) {
        error("No piece at source position");
        return state;
      }

      if (movingPiece.color !== state.turn) {
        error("Not your turn");
        return state;
      }

      // Validate move
      if (!validateMove(movingPiece, from, to, board)) {
        error("Invalid move");
        return state;
      }

      // Deep copy of the board to maintain immutability
      const newBoard = JSON.parse(JSON.stringify(board)) as Board;

      // Perform the move
      newBoard.rows[from.row].cells[from.col].piece = undefined;
      newBoard.rows[to.row].cells[to.col].piece = movingPiece;

      // Switch turn
      const nextTurn = state.turn === Color.WHITE ? Color.BLACK : Color.WHITE;

      // Handle 50 moves rule
      let newHalfMove =
        (state.turn === Color.WHITE
          ? state.whiteHalfMove
          : state.blackHalfMove) + 1;
      const targetPiece = board.rows[to.row]?.cells[to.col]?.piece;

      // Reset half-move clock if a pawn moved or a capture was made
      if (
        movingPiece.kind === PieceKind.PAWN ||
        (targetPiece && targetPiece.color !== movingPiece.color)
      ) {
        newHalfMove = 0;
      }

      // Check if the opponent is in checkmate
      let winner;
      if (isCheckmate(newBoard, nextTurn)) {
        // Set winner to current player (since opponent is in checkmate)
        winner = state.turn; // The player who made the move
      } else if (newHalfMove >= 50) {
        winner = null;
      } else if (isStalemate(newBoard, nextTurn)) {
        winner = null;
      }

      return {
        ...state,
        turn: nextTurn,
        board: newBoard,
        winner,
        whiteHalfMove:
          state.turn === Color.WHITE ? newHalfMove : state.whiteHalfMove,
        blackHalfMove:
          state.turn === Color.BLACK ? newHalfMove : state.blackHalfMove,
      };
    }

    case "JOIN": {
      if (
        state.whitePlayer == action.peerId ||
        state.blackPlayer == action.peerId
      )
        return state;

      if (!state.whitePlayer) {
        return {
          ...state,
          whitePlayer: action.peerId!,
          whitePlayerName: action.payload.name,
        };
      } else if (!state.blackPlayer) {
        return {
          ...state,
          blackPlayer: action.peerId!,
          blackPlayerName: action.payload.name,
        };
      } else {
        error("Room is full");
        return state;
      }
    }

    case "LEAVE": {
      if (state.whitePlayer == action.peerId) {
        return {
          ...state,
          winner: Color.BLACK,
        };
      }

      if (state.blackPlayer == action.peerId) {
        return {
          ...state,
          winner: Color.WHITE,
        };
      }

      return state;
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
  checkOwnKingSafety: boolean = true,
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

  let isValidMove = false;

  switch (piece.kind) {
    case PieceKind.PAWN: {
      // Move forward
      if (deltaCol === 0) {
        // One square forward
        if (deltaRow === direction && !targetCell.piece) {
          isValidMove = true;
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
            isValidMove = true;
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
        isValidMove = true;
      }
      break;
    }
    case PieceKind.ROOK: {
      if (deltaRow === 0 || deltaCol === 0) {
        if (isPathClear(board, from, to)) {
          isValidMove = true;
        }
      }
      break;
    }
    case PieceKind.BISHOP: {
      if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
        if (isPathClear(board, from, to)) {
          isValidMove = true;
        }
      }
      break;
    }
    case PieceKind.QUEEN: {
      if (
        deltaRow === 0 ||
        deltaCol === 0 ||
        Math.abs(deltaRow) === Math.abs(deltaCol)
      ) {
        if (isPathClear(board, from, to)) {
          isValidMove = true;
        }
      }
      break;
    }
    case PieceKind.KNIGHT: {
      if (
        (Math.abs(deltaRow) === 2 && Math.abs(deltaCol) === 1) ||
        (Math.abs(deltaRow) === 1 && Math.abs(deltaCol) === 2)
      ) {
        isValidMove = true;
      }
      break;
    }
    case PieceKind.KING: {
      if (Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1) {
        isValidMove = true;
      }
      break;
    }
    default:
      return false;
  }

  if (!isValidMove) {
    return false;
  }

  if (checkOwnKingSafety) {
    // Simulate the move and check if own king is in check
    const newBoard = JSON.parse(JSON.stringify(board)) as Board;

    // Perform the move on the new board
    newBoard.rows[to.row].cells[to.col].piece = piece;
    newBoard.rows[from.row].cells[from.col].piece = undefined;

    if (isInCheck(newBoard, piece.color)) {
      return false; // Move would leave own king in check
    }
  }

  return true;
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

// Function to Find the King's Position
function findKingPosition(
  board: Board,
  color: Color,
): { row: number; col: number } | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board.rows[row].cells[col];
      if (
        cell.piece &&
        cell.piece.color === color &&
        cell.piece.kind === PieceKind.KING
      ) {
        return { row, col };
      }
    }
  }
  return null;
}

// Function to Check if Square is Under Attack
function isSquareUnderAttack(
  board: Board,
  position: { row: number; col: number },
  byColor: Color,
): boolean {
  const opponentColor = byColor;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board.rows[row].cells[col];
      if (cell.piece && cell.piece.color === opponentColor) {
        const from = { row, col };
        const to = position;
        if (validateMove(cell.piece, from, to, board, false)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Function to Check if King is in Check
function isInCheck(board: Board, color: Color): boolean {
  const kingPosition = findKingPosition(board, color);
  if (!kingPosition) {
    // King not found, game over
    return true;
  }
  const opponentColor = color === Color.WHITE ? Color.BLACK : Color.WHITE;
  return isSquareUnderAttack(board, kingPosition, opponentColor);
}

// Function to Check if Player is in Checkmate
function isCheckmate(board: Board, color: Color): boolean {
  if (!isInCheck(board, color)) {
    return false; // Not in check, so cannot be in checkmate
  }

  // For each piece of the player
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board.rows[row].cells[col];
      if (cell.piece && cell.piece.color === color) {
        const from = { row, col };

        // Get possible moves for this piece
        const possibleMoves = getPossibleMoves(cell.piece, from, board);

        for (const to of possibleMoves) {
          // Simulate the move
          const newBoard = JSON.parse(JSON.stringify(board)) as Board;

          // Perform the move
          newBoard.rows[to.row].cells[to.col].piece = cell.piece;
          newBoard.rows[from.row].cells[from.col].piece = undefined;

          // Check if the king is still in check
          if (!isInCheck(newBoard, color)) {
            return false; // Found a legal move that gets out of check
          }
        }
      }
    }
  }

  // No legal moves found to get out of check
  return true;
}

// Check if Player is in Stalemate
function isStalemate(board: Board, color: Color): boolean {
  if (isInCheck(board, color)) {
    return false; // In check, so cannot be in stalemate
  }

  // For each piece of the player
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board.rows[row].cells[col];
      if (cell.piece && cell.piece.color === color) {
        const from = { row, col };

        // Get possible moves for this piece
        const possibleMoves = getPossibleMoves(cell.piece, from, board);

        if (possibleMoves.length > 0) {
          return false; // Found a legal move
        }
      }
    }
  }

  // No legal moves found
  return true;
}

// Suggest Next Possible Moves for a Selected Piece
export function getPossibleMoves(
  piece: Piece,
  from: { row: number; col: number },
  board: Board,
): { row: number; col: number }[] {
  const possibleMoves: { row: number; col: number }[] = [];

  // Loop over all squares on the board
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const to = { row, col };
      if (validateMove(piece, from, to, board)) {
        possibleMoves.push(to);
      }
    }
  }

  return possibleMoves;
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
  | [
      GameState,
      Dispatch<Action>,
      boolean,
      string,
      Dispatch<SetStateAction<string>>,
    ]
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
    whiteHalfMove: 0,
    blackHalfMove: 0,
  };

  const [state, dispatch, connected] = useEdgeReducerV0(
    chessReducer,
    initialState,
    {
      topic: room ? `turbo-chess-${room}` : "",
    },
  );

  return (
    <ChessContext.Provider value={[state, dispatch, connected, room, setRoom]}>
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

export function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
