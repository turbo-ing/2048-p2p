"use client";
import { useState } from "react";

import { Home } from "./Home";
import { Navbar } from "./Navbar";
import { PlayNow } from "./PlayNow";

const FullPageSlides = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState(3);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="relative w-screen h-screen">
      {/* <Navbar
        isDark={true}
        onClick={() => {
          goToSlide(0);
        }}
      /> */}
      {/* <Home activeIndex={activeIndex} goToSlide={goToSlide} /> */}
      <PlayNow
      // activeIndex={activeIndex}
      // goToSlide={goToSlide}
      // selectedMode={selectedMode}
      // setSelectedMode={setSelectedMode}
      />
    </div>
  );
};

export default FullPageSlides;
