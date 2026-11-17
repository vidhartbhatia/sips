"use client";

interface CafePinProps {
  type?: "reviewed" | "want-to-go";
  rating?: number;
  selected?: boolean;
  size?: number;
}

export default function CafePin({
  type = "reviewed",
  rating = 3,
  selected = false,
  size = 36,
}: CafePinProps) {
  // Scale pin size slightly based on rating (3 = base, 5 = larger)
  const scale = type === "reviewed" ? 0.85 + (rating / 5) * 0.3 : 0.85;
  const scaledSize = size * scale;

  if (type === "want-to-go") {
    return (
      <svg
        width={scaledSize}
        height={scaledSize * 1.3}
        viewBox="0 0 36 47"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform ${selected ? "scale-125" : "hover:scale-110"}`}
      >
        {/* Dashed pin outline - "want to go" style */}
        <path
          d="M18,2 C9,2 2,9 2,18 C2,30 18,45 18,45 C18,45 34,30 34,18 C34,9 27,2 18,2Z"
          stroke="#7FA5B5"
          strokeWidth="2"
          strokeDasharray="4 3"
          fill="#7FA5B5"
          fillOpacity="0.1"
          strokeLinecap="round"
        />
        {/* Question mark cup */}
        <text
          x="18"
          y="24"
          textAnchor="middle"
          fontSize="16"
          fontFamily="Caveat, cursive"
          fill="#7FA5B5"
          opacity="0.8"
        >
          ?
        </text>
      </svg>
    );
  }

  return (
    <svg
      width={scaledSize}
      height={scaledSize * 1.3}
      viewBox="0 0 36 47"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform ${selected ? "scale-125" : "hover:scale-110"}`}
    >
      {/* Pin body - hand drawn feel */}
      <path
        d="M18,2 C9,2 2,9 2,18 C2,30 18,45 18,45 C18,45 34,30 34,18 C34,9 27,2 18,2Z"
        stroke="#C4735B"
        strokeWidth="2"
        fill="#C4735B"
        fillOpacity="0.85"
        strokeLinecap="round"
      />
      {/* Coffee cup icon inside pin */}
      <path
        d="M12,14 C11.8,14.2 11.2,22 12,23 C12.8,24 22.2,24 23,23 C23.8,22 23.2,14.2 23,14"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="white"
        fillOpacity="0.3"
      />
      {/* Handle */}
      <path
        d="M23,16 C24,16 25,17 25,18.5 C25,20 24,21 23,21"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Steam */}
      <path
        d="M15,12 C15,11 15.5,10.5 15,10"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M18,11.5 C18,10.5 18.5,10 18,9.5"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
