import imageUniversity from "../assets/university.jpg";

export const HeroSection = () => {
  return (
    <>
      <div className="relative">
        <img
          src={imageUniversity}
          alt="University"
          className={"w-full h-full rounded-2xl  mx-auto"}
        />
        <div className="backdrop-blur-sm rounded-2xl text-center absolute top-1/2  left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-auto w-auto">
          <span className="text-4xl font-bold m-8 block">
            Find Your Lost Items Quickly
          </span>
          <p className="text-lg">
            Our campus Lost & Found web app helps students easily report lost
            and found items, connecting them with their belongings efficiently.
          </p>
        </div>
      </div>
    </>
  );
};
