import { useEffect, useState } from "react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth <= 1024) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    // Check screen size on initial load
    checkScreenSize();

    // Add event listener for resizing
    window.addEventListener("resize", checkScreenSize);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  return isMobile;
};

export default useIsMobile;
