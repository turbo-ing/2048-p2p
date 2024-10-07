import useIsMobile from "../hooks/useIsMobile";

interface HomeProps {
  activeIndex: number;
  goToSlide: (index: number) => void;
}
export const Home = ({ activeIndex, goToSlide }: HomeProps) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={`absolute inset-0 w-full h-full flex  justify-center text-white text-4xl transition-opacity duration-1000 ${
        activeIndex === 0 ? "opacity-100 z-20" : "opacity-0 z-10"
      }`}
    >
      <img
        alt=""
        className="w-full h-full absolute left-0"
        src="/img/backgroundPattern.png"
      />

      <div className="z-50 max-w-5xl mx-auto pt-40 lg:pt-44">
        <div className=" text-white text-5xl lg:text-6xl text-center font-semibold">
          <div>The Ultimate Decentralized,</div>
          <div>Serverless 2048 Experience.</div>
        </div>
        <div className="mt-6 max-w-2xl mx-auto mb-12">
          <p className="text-white text-xl lg:text-2xl text-center">
            Play solo or challenge a friend in real-time, peer-to-peer gameplay,
            powered by blockchain technology!
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
        {activeIndex === 0 && (
          <div className="pt-16 flex justify-center w-full">
            <img src="/svg/poweredBy.svg" alt="" />
          </div>
        )}
      </div>
    </div>
  );
};
