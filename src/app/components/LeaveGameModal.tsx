import { useState } from "react";
import ExitButton from "./ExitButton";
import Modal from "./Modal";
import Button from "./Button";
import Link from "next/link";
import { use2048 } from "@/reducer/2048";

export default function LeaveGameModal() {
  const [, dispatch] = use2048();
  const [exitModalOpen, setExitModalOpen] = useState<boolean>(false);

  const handleLeave = () => {
    dispatch({
      type: "LEAVE",
    });
  };

  return (
    <>
      <ExitButton
        onClose={() => setExitModalOpen(true)}
        className="text-base absolute top-5 right-5"
      />
      <Modal show={exitModalOpen}>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3>Confirm Exit</h3>
            <p className="text-sm">
              Are you sure you want to leave? All your game data will be lost.
            </p>
          </div>
          <div className="flex flex-row space-x-2">
            <Button variant="inverted" onClick={() => setExitModalOpen(false)}>
              Cancel
            </Button>
            <Link href="/" passHref className="w-full">
              <Button onClick={handleLeave}>Leave</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
