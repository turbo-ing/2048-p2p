import Link from "next/link";

interface NavbarProps {
  isDark: boolean;
}
export const Navbar = ({ isDark }: NavbarProps) => {
  return (
    <div className="absolute z-50 w-full">
      <div className="flex justify-between h-20 max-w-7xl mx-auto items-center px-8">
        <div className="flex gap-10 items-center">
          <img
            alt=""
            className="w-52"
            src={isDark ? "/img/chessLogoDark.svg " : "/img/chessLogo.svg"}
          />
          <Link
            className={`${
              isDark ? "text-white" : "text-[#475467]"
            } text-base font-semibold`}
            href=""
          >
            Home
          </Link>
        </div>
        <button className="py-2.5 px-4 shadow bg-[#F23939] rounded-full font-semibold text-base">
          Sign up
        </button>
      </div>
    </div>
  );
};
