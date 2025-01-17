import React from "react";
import { MultiplayerContext, MultiplayerContextProps } from "./context";

export const MultiplayerProvider = ({
  children,
  ...props
}: MultiplayerContextProps & { children: React.ReactNode }) => {
  return (
    <MultiplayerContext.Provider value={props}>
      {children}
    </MultiplayerContext.Provider>
  );
};
