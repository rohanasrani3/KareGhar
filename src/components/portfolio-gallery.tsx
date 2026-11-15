"use client";
import Image from "next/image";
import { useId, useState } from "react";
import { Rating } from "./rating";
import { creditFor } from "@/content/credits";
import "./profile.css";

export type GalleryItem = { id: string; title: string; url: string; formLabel: string; rating?: number | null };

function availableUrl(url: string) {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch { return false; }
}

export function mediaKind(url: string) {
  if (!availableUrl(url)) return "link";
  try {
    const path = new URL(url, "http://local.invalid").pathname.toLowerCase();
    if (/\.(png|jpe?g|webp|gif|svg)$/.test(path)) return "image";
    if (/\.(mp3|wav|ogg)$/.test(path)) return "audio";
    if (/\.(mp4|webm)$/.test(path)) return "video";
  } catch { /* Invalid legacy URLs remain links rather than breaking a profile. */ }
  return "link";
}

/** Credit for Wikimedia Commons media hosted on the site (sample records); user uploads have none. */
function CreditLine({ url, hi }: { url: string; hi: boolean }) {
  const credit = creditFor(url);
  if (!credit) return null;
  return <small className="photo-credit">{credit.kind === "recording" ? (hi ? "रिकॉर्डिंग" : "Recording") : (hi ? "फ़ोटो" : "Photo")}: <a href={credit.source} target="_blank" rel="noreferrer noopener">{credit.author}</a>, <a href={credit.licenseUrl} target="_blank" rel="noreferrer noopener">{credit.license}</a></small>;
}

export function PortfolioMedia({ item, hi }: { item: GalleryItem; hi: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!availableUrl(item.url) || failedUrl === item.url) return <p className="portfolio-media" role="status">{hi ? "यह कार्य अभी उपलब्ध नहीं है।" : "This work is currently unavailable."}</p>;
  const media = mediaKind(item.url);
  if (media === "image") return <Image src={item.url} alt={item.title} width={960} height={640} unoptimized onError={() => setFailedUrl(item.url)} />;
  if (media === "audio") return <div className="portfolio-media"><span className="media-symbol" aria-hidden="true">♫</span><span>{item.title}</span><audio controls preload="none" aria-label={item.title} src={item.url} onError={() => setFailedUrl(item.url)}>{hi ? "ऑडियो उपलब्ध नहीं है।" : "Audio is unavailable."}</audio></div>;
  if (media === "video") return <video controls preload="metadata" playsInline aria-label={item.title} src={item.url} onError={() => setFailedUrl(item.url)} />;
  return <div className="portfolio-media"><span className="media-symbol" aria-hidden="true">↗</span><a href={item.url} target="_blank" rel="noreferrer noopener">{hi ? "कार्य का लिंक खोलें" : "Open work link"} <span className="sr-only">{hi ? "(नई विंडो)" : "(new window)"}</span></a></div>;
}

export function PortfolioGallery({ items, hi, defaultView = "slider", allowViewToggle = true }: {
  items: GalleryItem[];
  hi: boolean;
  defaultView?: "slider" | "grid";
  allowViewToggle?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState(defaultView);
  const regionId = useId();
  if (!items.length) return null;
  const activeIndex = Math.min(index, items.length - 1);
  const current = items[activeIndex];
  const move = (step: number) => setIndex((value) => (Math.min(value, items.length - 1) + step + items.length) % items.length);
  return <div className="work-gallery">
    {allowViewToggle && items.length > 1 && <div className="gallery-toolbar">
      <span className="muted">{items.length} {hi ? "कलाकृतियाँ" : "works"}</span>
      <div className="view-switch" role="group" aria-label={hi ? "पोर्टफ़ोलियो दृश्य" : "Portfolio view"}>
        <button type="button" aria-pressed={view === "slider"} aria-controls={regionId} onClick={() => setView("slider")}><span aria-hidden="true">▣</span> {hi ? "स्लाइडर" : "Slideshow"}</button>
        <button type="button" aria-pressed={view === "grid"} aria-controls={regionId} onClick={() => setView("grid")}><span aria-hidden="true">▦</span> {hi ? "ग्रिड" : "Grid"}</button>
      </div>
    </div>}
    <div id={regionId}>
      {view === "grid" ? <div className="portfolio-grid">
        {items.map((item, i) => <article className="portfolio-grid-item" key={item.id}>
          <div className="portfolio-stage"><PortfolioMedia item={item} hi={hi} /></div>
          <div className="portfolio-caption"><div><strong>{item.title}</strong><small>{item.formLabel}</small>{item.rating !== undefined && <Rating score={item.rating} hi={hi} />}<CreditLine url={item.url} hi={hi} /></div><button type="button" className="gallery-expand" onClick={() => { setIndex(i); setView("slider"); }} aria-label={hi ? `${item.title} बड़ा देखें` : `View ${item.title} larger`}>↗</button></div>
        </article>)}
      </div> : <div className="portfolio-gallery" role="region" aria-roledescription={hi ? "स्लाइडर" : "carousel"} aria-label={hi ? "कलाकृतियाँ" : "Portfolio works"}>
        <div className="portfolio-stage" key={current.id}><PortfolioMedia item={current} hi={hi} /></div>
        <div className="portfolio-caption">
          <div aria-live="polite" aria-atomic="true"><strong>{current.title}</strong><small>{current.formLabel}</small>{current.rating !== undefined && <Rating score={current.rating} hi={hi} />}<CreditLine url={current.url} hi={hi} /></div>
          {items.length > 1 && <div className="gallery-controls">
            <button type="button" onClick={() => move(-1)} aria-label={hi ? "पिछला कार्य" : "Previous work"}>←</button>
            <span>{activeIndex + 1} / {items.length}</span>
            <button type="button" onClick={() => move(1)} aria-label={hi ? "अगला कार्य" : "Next work"}>→</button>
          </div>}
        </div>
        {items.length > 1 && <div className="portfolio-thumbs" aria-label={hi ? "कोई कलाकृति चुनें" : "Choose a work"}>
          {items.map((item, i) => <button key={item.id} type="button" className={i === activeIndex ? "selected" : ""} onClick={() => setIndex(i)} aria-label={item.title} aria-current={i === activeIndex ? "true" : undefined}>
            {mediaKind(item.url) === "image" ? <Image src={item.url} alt="" width={88} height={66} unoptimized /> : <span aria-hidden="true">{mediaKind(item.url) === "audio" ? "♫" : mediaKind(item.url) === "video" ? "▶" : "↗"}</span>}
          </button>)}
        </div>}
      </div>}
    </div>
  </div>;
}
