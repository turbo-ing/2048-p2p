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
    <div className="relative flex flex-col items-center rounded-full border-[#DC3434] px-16 py-1 bg-[#DC3434] gap-1">
      <div className="text-[#F2F4F7] text-sm">{title}</div>
      <div className="text-white text-base font-bold">{total}</div>
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
