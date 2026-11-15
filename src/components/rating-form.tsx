"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionForm } from "./action-form";
import { commissionAction } from "@/server/actions";

export function RatingForm({ id, rating, hi }: { id: string; rating: number | null; hi: boolean }) {
  const [score, setScore] = useState(rating ?? 0);
  const fieldId = useId();
  const router = useRouter();
  return <ActionForm action={commissionAction} lang={hi ? "hi" : "en"} label={rating === null ? (hi ? "रेटिंग सहेजें" : "Save rating") : (hi ? "रेटिंग अपडेट करें" : "Update rating")} onSuccess={() => router.refresh()} className="rating-form">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="rate" />
    <fieldset aria-describedby={fieldId + "-help"}>
      <legend>{hi ? "इस तैयार कार्य को रेटिंग दें" : "Rate this finished work"}</legend>
      <div className="rating-options">
        {[1, 2, 3, 4, 5].map((value) => <label key={value} className={value <= score ? "selected" : ""}>
          <input type="radio" name="rating" value={value} checked={score === value} onChange={() => setScore(value)} required />
          <span aria-hidden="true">★</span><span className="sr-only">{hi ? `5 में से ${value} सितारे` : `${value} out of 5 stars`}</span>
        </label>)}
        <span className="rating-choice" aria-live="polite">{score ? `${score}/5` : hi ? "सितारे चुनें" : "Choose stars"}</span>
      </div>
    </fieldset>
    <p className="field-help" id={fieldId + "-help"}>{hi ? "रेटिंग कलाकार के औसत में गिनी जाती है। इस कार्य की रेटिंग तभी सार्वजनिक दिखेगी जब आप तैयार कार्य साझा करेंगे। आप अपनी रेटिंग बाद में बदल सकते हैं।" : "Your rating contributes to the artist’s average. This work’s rating is public when you share the finished work. You can update your rating later."}</p>
  </ActionForm>;
}
