import Modal from "./Modal";

interface ResultModalProps {
  isWinner: boolean;
  open: boolean;
  onClose: () => void;
}
export const ResultModal = ({ open, onClose, isWinner }: ResultModalProps) => {
  return (
    <Modal onClose={onClose} show={open}>
      <div>
        <div className="relative">
          <img
            src={isWinner ? "/img/winner.png" : "/img/loser.png"}
            alt=""
            className="rounded-xl"
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#F5F5F6E5] font-semibold text-4xl">
            Checkmate!
          </div>
        </div>
        <div className="py-6 text-center">
          <div className="text-[#F5F5F6] font-semibold text-3xl">
            {isWinner ? "You've won the game!" : "You've lost the game."}
          </div>
          <div className="mt-3 text-[#94969C] font-medium text-xl">
            {isWinner
              ? "Congratulations! Your strategy and skill have prevailed. Well played!"
              : "Good effort! Learn from this match and come back stronger. Better luck next time!"}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="rounded-full py-2.5 px-4 border border-[#D0D5DD] bg-white text-[#344054] text-base font-semibold gap-1.5 flex items-center w-1/4  justify-center">
            <img alt="" src="/svg/home.svg" />
            <div>Home</div>
          </button>
          <button className="rounded-full py-2.5 px-4 bg-[#F23939] text-white text-base font-semibold gap-1.5 flex items-center w-3/4 justify-center">
            <img alt="" src="/svg/repeat.svg" />
            <div>Rematch</div>
          </button>
        </div>
      </div>
    </Modal>
  );
};
