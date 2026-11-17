import Image from "next/image";
import { DIVIDER } from "@/lib/illustrations";

export default function InkDivider({ className = "" }: { className?: string }) {
  if (DIVIDER) {
    return (
      <Image
        src={DIVIDER.src}
        width={DIVIDER.width}
        height={DIVIDER.height}
        alt=""
        aria-hidden="true"
        className={`w-full ${className}`}
        unoptimized={DIVIDER.src.endsWith(".svg")}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 800 24"
      fill="none"
      className={`w-full ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0,12 C50,6 120,18 200,10 C280,2 340,20 420,12 C500,4 560,18 640,8 C720,-2 760,16 800,12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.12"
        fill="none"
      />
    </svg>
  );
}
