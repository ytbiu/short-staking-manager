import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header>
      <div className="flex justify-center items-center bg-black/90 text-amber-50">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="logo"
            width={150}
            height={100}
            className="cursor-pointer"
          />
        </Link>
        <Link
          href="/machine/staking"
          className="ml-20 text-2xl text-gray-400 hover:text-gray-300 active:text-white focus:text-gray-300 transition-colors outline-none"
        >
          质押中的机器列表
        </Link>
        <Link
          href="/machine/reported"
          className="ml-20 text-2xl text-gray-400 hover:text-gray-300 active:text-white focus:text-gray-300 transition-colors outline-none"
        >
          机器被举报记录
        </Link>
      </div>
    </header>
  );
}
