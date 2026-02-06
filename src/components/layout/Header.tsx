"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-gray-900">
          SRT Checker
        </Link>
        <nav className="flex gap-4">
          <Link
            href="/"
            className={`text-sm font-medium ${
              pathname === "/"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            검사하기
          </Link>
          <Link
            href="/terms"
            className={`text-sm font-medium ${
              pathname === "/terms"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            용어 사전
          </Link>
        </nav>
      </div>
    </header>
  );
}
