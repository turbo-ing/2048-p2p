import React, { FC } from "react";

import Button from "../Button";
import Box from "../Box";
import Text from "../Text";

import StyledModal from "./StyledModal";
import StyledBackdrop from "./StyledBackdrop";

export interface NotificationProps {
  win: boolean;
  onClose: () => void;
}

const Notification: FC<NotificationProps> = ({ win, onClose }) => (
  <StyledModal>
    <StyledBackdrop />
    <Box background="transparent" paddingBlock="s5">
      <Text color="primary" fontSize={22}>
        {win ? "You win! Continue?" : "Oops...Game Over!"}
      </Text>
    </Box>
    <Button onClick={onClose}>{win ? "Continue" : "Retry"}</Button>
  </StyledModal>
);

export default Notification;
