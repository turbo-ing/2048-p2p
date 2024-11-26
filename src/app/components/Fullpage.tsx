"use client";
import { useState } from "react";

import { Home } from "./Home";
import { Navbar } from "./Navbar";
import { PlayNow } from "./PlayNow";
import RoomModal from "./RoomModal";

const FullPageSlides = () => {
  // const [activeIndex, setActiveIndex] = useState(0);
  // const [selectedMode, setSelectedMode] = useState(3);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // const goToSlide = (index: number) => {
  //   setActiveIndex(index);
  // };

  return (
    <div className="relative w-screen h-screen">
      <Navbar
        isDark={true}
        // onClick={() => {
        //   goToSlide(0);
        // }}
      />
      <Home openModel={() => setIsModalOpen(true)} />
      {/* <PlayNow
        activeIndex={activeIndex}
        goToSlide={goToSlide}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
      /> */}
      {/* Button to open the RoomModal */}
      <RoomModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default FullPageSlides;
