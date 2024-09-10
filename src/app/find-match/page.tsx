import { Navbar } from "../components/Navbar";

export default function FindMatch() {
  return (
    <>
      <Navbar isDark={true} />
      <div className="relative flex items-center text-[#D9D9D9]">
        <div className="absolute max-w-7xl mx-auto w-full left-1/2 -translate-x-1/2 md:px-16 px-2 z-40">
          <div className="flex items-center gap-4">
            <img
              alt=""
              className="w-[72px] h-[72px]"
              src="/svg/searching.svg"
            />
            <div className="text-6xl font-semibold">Searching Match</div>
          </div>
          <div className="mt-4 text-2xl font-semibold max-w-[598px]">
            Matching you with a worthy adversary. Just a moment...
          </div>
        </div>
        <div className="md:w-2/5 bg-black h-screen flex" />
        <div className="w-full md:w-3/5 h-screen relative">
          <div className="absolute w-full h-full bg-gradient" />
          <video
            autoPlay
            loop
            muted
            className="w-full object-cover h-full"
            src="/video/playchess.mp4"
          />
        </div>
      </div>
    </>
  );
}
