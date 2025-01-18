import React, { FC, useEffect, useRef, useState } from "react";

export interface ScoreBoardProps {
  title: string;
  total: number;
}

const ScoreBoard: FC<ScoreBoardProps> = ({ total, title }) => {
  const totalRef = useRef(total);
  const [score, setScore] = useState(() => total - totalRef.current);

  useEffect(() => {
    setScore(total - totalRef.current);
    totalRef.current = total;
  }, [total]);

  return (
    <div className="relative flex flex-col items-center rounded-xl border-text text-text px-2 py-1 border gap-1 min-w-[40%]">
      <div className=" text-sm font-bold">{title}</div>
      <div className="text-xl font-light">{total}</div>
      {score > 0 && (
        <div
          key={total}
          className="absolute w-full mb-2.5 ml-0 text-center bg-none transition-all duration-200 ease-in animate-fadeOut"
        >
          +{score}
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;
