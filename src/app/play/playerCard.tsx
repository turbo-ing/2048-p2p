interface PlayerCardProps {
  image: string;
  address: `0x${string}`;
  amount: string;
  opponent?: boolean;
}

export const PlayerCard = ({
  image,
  address,
  amount,
  opponent = false,
}: PlayerCardProps) => {
  function shortenAddress(address: string): string {
    // Ensure that the address is long enough to be shortened
    if (address.length <= 6 + 4) {
      return address;
    }

    // Slice the start and end part of the string
    const start = address.slice(0, 6);
    const end = address.slice(-4);

    // Return the shortened version with "..."
    return `${start}...${end}`;
  }
  return (
    <div className={`flex flex-col ${opponent && "flex-col-reverse"}`}>
      <div
        className={`p-6 ${
          opponent ? "bg-[#F23939]" : "bg-[#CFD1D2]"
        } rounded-full flex items-center gap-6`}
      >
        <div className="relative">
          <img
            src={image}
            alt=""
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="absolute right-0 -bottom-1 border border-black bg-[#D8E3DA] w-6 h-6 rounded-full">
            <img
              src="/svg/chess-queen.svg"
              alt=""
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        </div>
        <div className="text-[#101828]">
          <div className="text-4xl font-semibold">
            {shortenAddress(address)}
          </div>
          <div className="mt-1 font-medium">{amount} ETH</div>
        </div>
      </div>
      <div className="flex justify-evenly py-2 px-6 my-5">
        <div className="text-center w-1/3">
          <div className="text-2xl text-[#FCFCFD] font-semibold">12</div>
          <div className="text-sm font-medium text-[#F2F4F7]">WIN</div>
        </div>
        <div className="text-center w-1/3">
          <div className="text-2xl text-[#FCFCFD] font-semibold">12</div>
          <div className="text-sm font-medium text-[#F2F4F7]">DRAW</div>
        </div>
        <div className="text-center w-1/3">
          <div className="text-2xl text-[#FCFCFD] font-semibold">12</div>
          <div className="text-sm font-medium text-[#F2F4F7]">LOSE</div>
        </div>
      </div>
      <hr className={opponent ? "mt-6" : "mb-6"} />
    </div>
  );
};
