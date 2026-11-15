"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNavigation({ hi }: { hi: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/talent", label: hi ? "कलाकार खोजें" : "Find Artists", active: pathname.startsWith("/talent") || pathname.startsWith("/people") },
    { href: "/demands", label: hi ? "माँग खोजें" : "Find Demand", active: pathname.startsWith("/demands") },
    { href: "/impact", label: hi ? "प्रभाव" : "Our Impact", active: pathname === "/impact" },
  ];
  return <nav className="header-center" aria-label={hi ? "मुख्य मेनू" : "Main navigation"}>{links.map((link) => <Link key={link.href} href={link.href} aria-current={link.active ? "page" : undefined}>{link.label}</Link>)}</nav>;
}
