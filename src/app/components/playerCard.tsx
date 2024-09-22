interface PlayerCardProps {
  address: string;
  amount: string;
  isWhite?: boolean;
  isTop: boolean;
}

function shortenAddress(address: string): string {
  return address;
  // // Ensure that the address is long enough to be shortened
  // if (address.length <= 4 + 3) {
  //   return address;
  // }

  // // Slice the start and end part of the string
  // const start = address.slice(0, 4);
  // const end = address.slice(-3);

  // // Return the shortened version with "..."
  // return `${start}...${end}`;
}

export const PlayerCard = ({
  address,
  amount,
  isWhite = false,
  isTop,
}: PlayerCardProps) => {
  return (
    <div className={`flex w-96 flex-col ${!isTop && "flex-col-reverse"}`}>
      <div
        className={`p-6 ${
          isWhite ? "bg-[#F23939]" : "bg-[#CFD1D2]"
        } rounded-full flex items-center gap-6 relative z-10 overflow-hidden`}
      >
        <img
          alt=""
          className="absolute right-0 -z-10 "
          src={isWhite ? "/svg/red-icon.svg" : "/svg/black-icon.svg"}
        />
        <div className="relative">
          <img
            alt=""
            className="w-16 h-16 rounded-full object-cover"
            src={isWhite ? "/assets/king-w.svg" : "/assets/king-b.svg"}
          />
          {/* <div className="absolute right-0 -bottom-1 border border-black bg-[#D8E3DA] w-6 h-6 rounded-full">
            <img
              alt=""
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              src={
                isWhite ? "/svg/red-team-icon.svg" : "/svg/black-team-icon.svg"
              }
            />
          </div> */}
        </div>
        <div className="text-[#101828]">
          <div>
            <div
              className={`text-4xl font-semibold truncate ${
                isWhite ? "text-white" : ""
              }`}
            >
              {shortenAddress(address)}
            </div>
            <div
              className={`text-[#101828] font-bold text-lg ${
                isWhite ? "text-white" : ""
              }`}
            >
              {isWhite ? "White" : "Black"}
            </div>
          </div>
          {/* <div className="mt-1 font-medium">{amount} ETH</div> */}
        </div>
      </div>
      <div className="flex justify-evenly py-2 px-6 my-5">
        <div className="text-center w-1/3">
          <div className="text-2xl text-[#FCFCFD] font-semibold" />
          <div className="text-sm font-medium text-[#F2F4F7]" />
        </div>
        <div className="text-center w-1/3">
          <div className="text-2xl text-[#FCFCFD] font-semibold" />
          <div className="text-sm font-medium text-[#F2F4F7]" />
        </div>
        <div className="text-center w-1/3">
          <div className="text-2xl text-[#FCFCFD] font-semibold" />
          <div className="text-sm font-medium text-[#F2F4F7]" />
        </div>
      </div>
      <hr className={!isTop ? "mt-6" : "mb-6"} />
    </div>
  );
};

interface PlayerMobileCardProps {
  address: string;
  isWhite?: boolean;
}

export const PlayerMobileCard = ({
  address,
  isWhite,
}: PlayerMobileCardProps) => {
  return (
    <div className="flex w-full justify-center">
      <div
        className={`p-3 rounded-full ${
          isWhite ? "bg-[#F23939]" : "bg-[#CFD1D2]"
        } w-[120px] h-[120px] relative overflow-hidden z-20`}
      >
        <img
          alt=""
          className="absolute bottom-0 left-1/2 -translate-x-1/2 -z-10"
          src={isWhite ? "/svg/red-icon.svg" : "/svg/black-icon.svg"}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-3">
          <div className="relative flex justify-center">
            <img
              alt=""
              className="w-16 h-16 rounded-full object-cover mb-1"
              src={isWhite ? "/assets/king-w.svg" : "/assets/king-b.svg"}
            />
            {/* <div className="absolute right-0 -bottom-1 border border-black bg-[#D8E3DA] w-6 h-6 rounded-full">
              <img
                alt=""
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                src={
                  isWhite
                    ? "/svg/red-team-icon.svg"
                    : "/svg/black-team-icon.svg"
                }
              />
            </div> */}
          </div>
          <div
            className={`text-center truncate ${
              isWhite ? "text-white" : "text-[#101828]"
            }`}
          >
            {shortenAddress(address)}
          </div>
        </div>
      </div>
    </div>
  );
};
