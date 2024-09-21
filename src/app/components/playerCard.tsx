interface PlayerCardProps {
  image: string;
  address: string;
  amount: string;
  isPlayer?: boolean;
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
  image,
  address,
  amount,
  isPlayer = false,
}: PlayerCardProps) => {
  return (
    <div className={`flex w-96 flex-col ${isPlayer && "flex-col-reverse"}`}>
      <div
        className={`p-6 ${
          isPlayer ? "bg-[#F23939]" : "bg-[#CFD1D2]"
        } rounded-full flex items-center gap-6 relative z-10 overflow-hidden`}
      >
        <img
          alt=""
          className="absolute right-0 -z-10 "
          src={isPlayer ? "/svg/red-icon.svg" : "/svg/black-icon.svg"}
        />
        <div className="relative">
          <img
            alt=""
            className="w-16 h-16 rounded-full object-cover"
            src={image}
          />
          <div className="absolute right-0 -bottom-1 border border-black bg-[#D8E3DA] w-6 h-6 rounded-full">
            <img
              alt=""
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              src={
                isPlayer ? "/svg/red-team-icon.svg" : "/svg/black-team-icon.svg"
              }
            />
          </div>
        </div>
        <div className="text-[#101828]">
          <div>
            <div className="text-4xl font-semibold truncate">
              {shortenAddress(address)}
            </div>
            <div className="text-[#101828] font-bold text-lg">
              {isPlayer ? "Player" : "Opponent"}
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
      <hr className={isPlayer ? "mt-6" : "mb-6"} />
    </div>
  );
};

interface PlayerMobileCardProps {
  image: string;
  address: string;
  isPlayer?: boolean;
}

export const PlayerMobileCard = ({
  address,
  image,
  isPlayer,
}: PlayerMobileCardProps) => {
  return (
    <div className="flex w-full justify-center">
      <div
        className={`p-3 rounded-full ${
          isPlayer ? "bg-[#F23939]" : "bg-[#CFD1D2]"
        } w-[120px] h-[120px] relative overflow-hidden z-20`}
      >
        <img
          alt=""
          className="absolute bottom-0 left-1/2 -translate-x-1/2 -z-10"
          src={isPlayer ? "/svg/red-icon.svg" : "/svg/black-icon.svg"}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-3">
          <div className="relative flex justify-center">
            <img
              alt=""
              className="w-16 h-16 rounded-full object-cover"
              src={image}
            />
            <div className="absolute right-0 -bottom-1 border border-black bg-[#D8E3DA] w-6 h-6 rounded-full">
              <img
                alt=""
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                src={
                  isPlayer
                    ? "/svg/red-team-icon.svg"
                    : "/svg/black-team-icon.svg"
                }
              />
            </div>
          </div>
          <div className="">{shortenAddress(address)}</div>
        </div>
      </div>
    </div>
  );
};
