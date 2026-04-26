import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ReactNode } from "react";

const scatteredIcons = [
  { src: "/assets/pizza.png", alt: "pizza", top: "9%", left: "8%", size: 80, rotate: -16 },
  { src: "/assets/burger.png", alt: "burger", top: "14%", left: "68%", size: 88, rotate: 12 },
  {
    src: "/assets/french-fries.png",
    alt: "fries",
    top: "9%",
    left: "94%",
    size: 74,
    rotate: -7,
  },
  { src: "/assets/pizza.png", alt: "pizza", top: "36%", left: "46%", size: 84, rotate: 9 },
  { src: "/assets/burger.png", alt: "burger", top: "9%", left: "35%", size: 92, rotate: -12 },
  {
    src: "/assets/french-fries.png",
    alt: "fries",
    top: "62%",
    left: "25%",
    size: 78,
    rotate: 13,
  },
  { src: "/assets/pizza.png", alt: "pizza", top: "55%", left: "67%", size: 86, rotate: -9 },
  { src: "/assets/burger.png", alt: "burger", top: "65%", left: "90%", size: 90, rotate: 10 },
  {
    src: "/assets/french-fries.png",
    alt: "fries",
    top: "38%",
    left: "10%",
    size: 72,
    rotate: 6,
  },
];

const PatternBlock = ({ idSuffix }: { idSuffix: string }) => (
  <div className="relative h-screen w-full shrink-0">
    {scatteredIcons.map((icon, index) => (
      <div
        key={`${icon.alt}-${index}-${idSuffix}`}
        className="pointer-events-none absolute"
        style={{
          top: icon.top,
          left: icon.left,
          transform: `translate(-50%, -50%) rotate(${icon.rotate}deg)`,
          opacity: 0.45,
        }}
      >
        <Image
          src={icon.src}
          alt={icon.alt}
          width={icon.size}
          height={icon.size}
          style={{
            filter: "brightness(0) invert(1) grayscale(1) contrast(1.5)",
          }}
        />
      </div>
    ))}
  </div>
);

type SharedLayoutProps = {
  children: ReactNode;
  activeTab: "home" | "deals" | "about";
};

export function SharedLayout({ children, activeTab }: SharedLayoutProps) {
  const getTabClass = (tabName: "home" | "deals" | "about") => {
    const baseClass = "relative px-2 py-2 text-sm font-bold text-white transition hover:text-red-400";
    const activeClass = "after:absolute after:-bottom-1 after:left-0 after:h-[3px] after:w-full after:bg-red-600";
    return activeTab === tabName ? `${baseClass} ${activeClass}` : baseClass;
  };

  return (
    <main
      className="relative w-full overflow-x-hidden overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, #151515 0%, #232323 100%)",
        height: "100vh",
        perspective: "10px",
      }}
    >
      <header className="absolute inset-x-0 top-0 z-20 h-25">
        <nav className="mx-auto flex h-full w-full max-w-3xl items-center justify-center gap-8 px-4">
          <Link href="/" className={getTabClass("home")}>
            Home
          </Link>
          <Link href="/deals" className={getTabClass("deals")}>
            Deals
          </Link>
          <Link href="/about" className={getTabClass("about")}>
            About
          </Link>

          <button aria-label="Search" className="ml-2 text-white transition hover:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </nav>

        <div className="absolute left-5 top-1/2 flex -translate-y-1/2 items-center sm:left-7">
          <Image
            src="/assets/logoo.png"
            alt="DealsForYou logo"
            width={220}
            height={220}
            priority
            className="h-[220px] w-[220px] object-contain"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(13%) sepia(94%) saturate(6361%) hue-rotate(357deg) brightness(112%) contrast(117%)",
            }}
          />
        </div>

        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center sm:right-7">
          <UserButton />
        </div>
      </header>

      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          transform: "translateZ(-25px) scale(3.5)",
          transformOrigin: "top",
        }}
      >
        <div className="flex flex-col w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <PatternBlock key={i} idSuffix={i.toString()} />
          ))}
        </div>
      </div>

      {children}
    </main>
  );
}
