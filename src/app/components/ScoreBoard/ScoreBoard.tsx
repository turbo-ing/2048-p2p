import React, { FC, useEffect, useRef, useState } from "react";

import Text from "../Text";
import Box from "../Box";

import StyledScore from "./StyledScore";

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
    <Box
      background="secondary"
      borderRadius="9999px"
      boxSizing="border-box"
      flexDirection="column"
      inlineSize="92px"
      justifyContent="center"
      marginInline="s2"
      paddingBlock="s3"
      position="relative"
    >
      <Text color="white" fontSize={14}>
        {title}
      </Text>
      <Text color="foreground" fontSize={18} fontWeight="bold">
        {total}
      </Text>
      {score > 0 && (
        // Assign a different key to let React render the animation from beginning
        <StyledScore key={total}>
          <Text color="primary" fontSize={18} fontWeight="bold">
            +{score}
          </Text>
        </StyledScore>
      )}
    </Box>
  );
};

export default ScoreBoard;
