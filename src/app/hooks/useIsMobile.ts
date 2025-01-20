import { useEffect, useState } from "react";

const useIsMobile = () => {
  const [isMobileByUserAgent, setIsMobileByUserAgent] = useState(false);
  const [isMobileByScreenSize, setIsMobileByScreenSize] = useState(false);

  useEffect(() => {
    // Check if the device is mobile based on user-agent
    const checkUserAgent = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent,
        );
      setIsMobileByUserAgent(isMobileDevice);
    };

    // Check if the screen size is small enough to consider mobile
    const checkScreenSize = () => {
      setIsMobileByScreenSize(window.innerWidth <= 1024);
    };

    // Run both checks on initial load
    checkUserAgent();
    checkScreenSize();

    // Add event listener for screen resizing
    window.addEventListener("resize", checkScreenSize);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  return { isMobileByUserAgent, isMobileByScreenSize };
};

export default useIsMobile;
