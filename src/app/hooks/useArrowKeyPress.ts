import { useCallback, useEffect } from "react";

import { ArrowKey, ArrowKeyType } from "@/utils/types";
import { Direction } from "@/reducer/2048";

const isArrowKey = (key: string): key is ArrowKeyType =>
  Object.keys(ArrowKey).includes(key);

// Rather than returning the direction, we pass the direction to the given callback
// so that keydown event won't make React rerender until the callback changes some states
const useArrowKeyPress = (cb: (dir: Direction) => void) => {
  const onKeyDown = useCallback(
    ({ key }: KeyboardEvent) => {
      if (isArrowKey(key)) {
        switch (key) {
          case "ArrowUp":
            cb("up");
            break;
          case "ArrowDown":
            cb("down");
            break;
          case "ArrowLeft":
            cb("left");
            break;
          case "ArrowRight":
            cb("right");
            break;
          default:
            return;
        }
      }
    },
    [cb],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);
};

export default useArrowKeyPress;
