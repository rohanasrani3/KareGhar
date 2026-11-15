import type { Photo } from "@/content/photos";

/** Attribution required by CC BY / CC BY-SA: author, source and licence, each linked. */
export function PhotoCredit({ photo, hi }: { photo: Photo; hi: boolean }) {
  return (
    <small className="photo-credit">
      {hi ? "फ़ोटो" : "Photo"}:{" "}
      <a href={photo.source} target="_blank" rel="noreferrer noopener">{photo.author}</a>,{" "}
      <a href={photo.licenseUrl} target="_blank" rel="noreferrer noopener">{photo.license}</a>
    </small>
  );
}
