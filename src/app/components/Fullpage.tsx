"use client";
import { useState } from "react";

import { Home } from "./Home";
import { Navbar } from "./Navbar";
import { PlayNow } from "./PlayNow";

const FullPageSlides = () => {
  // Track the currently active slide
  const [activeIndex, setActiveIndex] = useState(0);

  // Function to navigate to the next slide
  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="relative w-screen h-screen">
      <Navbar isDark={activeIndex === 0 ? false : true} />
      <Home activeIndex={activeIndex} goToSlide={goToSlide} />
      <PlayNow activeIndex={activeIndex} goToSlide={goToSlide} />
    </div>
  );
};

export default FullPageSlides;
