"use client";

import Modal from "./Modal";

interface ConnectingModalProps {
  open: boolean;
}
export const ConnectingModal = ({ open }: ConnectingModalProps) => {
  return (
    <Modal show={open}>
      <div>
        <div className="relative">
          <img alt="" className="rounded-xl" src={"/img/winner.png"} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#F5F5F6E5] font-semibold text-4xl">
            Connecting...
          </div>
        </div>
      </div>
    </Modal>
  );
};
