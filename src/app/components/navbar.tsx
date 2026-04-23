import Image from "next/image";
import Link from "next/link";
import dualmindLogo from "../../assets/dualmind.png";
export const Navbar = () => {
  return (
    <nav className="h-12 md:h-16 w-full  p-4 md:px-10 md:py-6 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg md:text-2xl">
        <Image
          src={dualmindLogo}
          alt="dualmind logo"
          className="w-24 md:w-32"
        />
      </Link>
      <Link href="compatibility" className="flex items-center gap-2">
        <p className="text-sm">/compatibility </p>
        <span className="rounded-full bg-white text-black py-0.5 px-2 text-xs font-bold">
          BETA
        </span>
      </Link>
    </nav>
  );
};
