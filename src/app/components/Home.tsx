// interface HomeProps {
//   activeIndex: number;
//   goToSlide: (index: number) => void;
// }
// export const Home = ({ activeIndex, goToSlide }: HomeProps) => {
//   return (
//     <div
//       className={`absolute inset-0 w-full h-full flex items-center justify-center text-4xl transition-opacity duration-1000 bg-background ${
//         activeIndex === 0 ? "opacity-100 z-20" : "opacity-0 z-10"
//       }`}
//     >
//       {/* <img
//         alt=""
//         className="w-full h-full absolute left-0"
//         src="/img/2048_home_bg.png"
//       /> */}
//       <div className="z-50 max-w-5xl mx-auto text-text">
//         <div className="text-5xl lg:text-6xl text-center font-semibold">
//           <p>
//             The Ultimate Decentralized,
//             <br />
//             Serverless 2048 Experience.
//           </p>
//         </div>
//         <div className="mt-6 max-w-2xl mx-auto mb-12">
//           <p className="text-white text-2xl text-center">
//             Play solo or challenge a friend in real-time, peer-to-peer gameplay,
//             powered by blockchain technology!
//           </p>
//         </div>
//         <div className="flex gap-3 justify-center">
//           <button className="py-4 px-[22px] shadow-sm border border-[#D0D5DD] bg-white rounded-full flex items-center text-[##344054]">
//             <img alt="" className="w-6 h-6" src="/svg/play.svg" />
//             <div className="text-lg text-[#344054]">Demo</div>
//           </button>
//           <button
//             className="py-4 px-[22px] shadow-sm border border-[#F23939] bg-[#F23939] rounded-full flex items-center"
//             onClick={() => {
//               goToSlide(1);
//             }}
//           >
//             <div className="text-lg">Play now</div>
//           </button>
//         </div>
//         <div className="text-center mt-16">
//           <img
//             alt=""
//             className="inline-block"
//             src="/svg/2048-power-by-turbo.svg"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };
