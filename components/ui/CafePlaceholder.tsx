import Image from "next/image";

interface CafePlaceholderProps {
  cafeName?: string;
  className?: string;
}

export default function CafePlaceholder({
  cafeName,
  className = "",
}: CafePlaceholderProps) {
  return (
    <div
      className={`flex aspect-[4/3] items-center justify-center rounded-lg bg-stone ${className}`}
    >
      <div className="text-center">
        <Image
          src="/illustrations/coffee-cup.svg"
          alt=""
          width={48}
          height={48}
          className="mx-auto opacity-25"
        />
        {cafeName && (
          <span className="mt-2 block font-heading text-lg text-espresso-muted/50">
            {cafeName}
          </span>
        )}
      </div>
    </div>
  );
}
