import React from "react";

const CreateRoom = ({ color = "currentColor", size = 19 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 19 20"
    fill="none"
  >
    <path
      d="M9.49996 6.66669V13.3334M6.16663 10H12.8333M17.8333 10C17.8333 14.6024 14.1023 18.3334 9.49996 18.3334C4.89759 18.3334 1.16663 14.6024 1.16663 10C1.16663 5.39765 4.89759 1.66669 9.49996 1.66669C14.1023 1.66669 17.8333 5.39765 17.8333 10Z"
      stroke={color}
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CreateRoom;
