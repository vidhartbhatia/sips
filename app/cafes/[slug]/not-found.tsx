import Link from "next/link";
import Image from "next/image";

export default function CafeNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="text-center">
        <Image
          src="/illustrations/coffee-cup.svg"
          alt=""
          width={64}
          height={64}
          className="mx-auto mb-4 opacity-30"
        />
        <h1 className="font-heading text-3xl font-bold text-espresso">
          Cafe not found
        </h1>
        <p className="mt-2 text-lg text-espresso-muted">
          We couldn&apos;t find that one in our journal.
        </p>
        <Link
          href="/cafes"
          className="mt-6 inline-block text-base text-terracotta hover:text-terracotta-dark hover:underline"
        >
          &larr; Back to all cafes
        </Link>
      </div>
    </div>
  );
}
