import React, { useState, useEffect } from "react";

const TurboEdgeNotification = ({ connected }: { connected: boolean }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!connected) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [connected]);

  return (
    <div
      className={`fixed bottom-0 left-0 w-full bg-black text-white flex justify-center p-2 z-50 transform transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-3 w-3 border-t-2"></div>
        <span className="text-sm">Connecting to TurboEdge</span>
      </div>
    </div>
  );
};

export default TurboEdgeNotification;
