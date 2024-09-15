import useIsMobile from "../hooks/useIsMobile";

interface HomeProps {
  activeIndex: number;
  goToSlide: (index: number) => void;
}
export const Home = ({ activeIndex, goToSlide }: HomeProps) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={`absolute inset-0 w-full h-full flex items-center justify-center text-white text-4xl transition-opacity duration-1000 ${
        activeIndex === 0 ? "opacity-100 z-20" : "opacity-0 z-10"
      }`}
    >
      <img
        alt=""
        className="w-full h-full absolute left-0"
        src="/img/backgroundPattern.png"
      />
      {!isMobile && (
        <>
          <div className="absolute left-0 top-1/2 -translate-y-[45%]">
            <img
              alt=""
              className="w-[160px] h-[580px] xl:w-[206px] xl:h-full"
              src="/img/chess.png"
            />
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-[45%]">
            <img
              alt=""
              className="w-[160px] h-[580px] xl:w-[206px] xl:h-full"
              src="/img/chess-horse.png"
            />
          </div>
        </>
      )}

      <div className="z-50 max-w-5xl mx-auto">
        <div className=" text-[#101828] text-5xl lg:text-7xl text-center font-semibold">
          Experience Chess in the
          <span className="text-[#DC3434]"> Decentralized</span> Web3 Era!
        </div>
        <div className="mt-6 max-w-2xl mx-auto mb-12">
          <p className="text-[#475467] text-xl font-medium text-center">
            Ditch the servers and embrace the future. BlockKnight’s peer-to-peer
            technology offers a decentralized, secure, and thrilling chess
            experience—right in your browser!
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button className="py-4 px-[22px] shadow-sm border border-[#D0D5DD] bg-white rounded-full flex items-center text-[##344054]">
            <img alt="" className="w-6 h-6" src="/svg/play.svg" />
            <div className="text-lg text-[#344054]">Demo</div>
          </button>
          <button
            className="py-4 px-[22px] shadow-sm border border-[#D0D5DD] bg-[#F23939] rounded-full flex items-center"
            onClick={() => {
              goToSlide(1);
            }}
          >
            <div className="text-lg">Play now</div>
          </button>
        </div>
      </div>
    </div>
  );
};
