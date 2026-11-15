"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function DirectoryTile({
  href,
  title,
  cover,
  formLabel,
  children,
  footer,
  action,
}: {
  href: string;
  title: string;
  cover?: string;
  formLabel: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  action: string;
}) {
  const [failedCover, setFailedCover] = useState<string | null>(null);
  let safeCover = cover?.startsWith("/") && !cover.startsWith("//") ? cover : undefined;
  if (cover && !safeCover) {
    try {
      const parsed = new URL(cover);
      if (["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password) safeCover = cover;
    } catch { /* Malformed legacy artwork URLs use the art-form label. */ }
  }
  return (
    <article className="directory-tile">
      <Link href={href} className="tile-cover" tabIndex={-1} aria-hidden="true">
        {safeCover && failedCover !== safeCover ? (
          <Image src={safeCover} width={480} height={300} unoptimized alt="" onError={() => setFailedCover(safeCover!)} />
        ) : (
          <span>{formLabel}</span>
        )}
      </Link>
      <div className="tile-body">
        <h2>
          <Link href={href}>{title}</Link>
        </h2>
        {children}
        <div className="tile-footer">{footer}</div>
        <Link className="tile-action" href={href}>{action}</Link>
      </div>
    </article>
  );
}
