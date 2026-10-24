/** Motifs de signalement. Les clés doivent rester celles du `check` de la table `reports`. */

export type PlaceReportReason = 'closed' | 'wrong_info' | 'duplicate' | 'other';
export type ReviewReportReason = 'offensive' | 'fake' | 'off_topic' | 'other';
export type ReportReason = PlaceReportReason | ReviewReportReason;

export const PLACE_REPORT_REASONS: { value: PlaceReportReason; label: string }[] = [
  { value: 'closed', label: 'Ce lieu a fermé' },
  { value: 'wrong_info', label: 'Informations erronées' },
  { value: 'duplicate', label: 'Doublon' },
  { value: 'other', label: 'Autre problème' },
];

export const REVIEW_REPORT_REASONS: { value: ReviewReportReason; label: string }[] = [
  { value: 'offensive', label: 'Insultant ou inapproprié' },
  { value: 'fake', label: 'Faux avis' },
  { value: 'off_topic', label: 'Hors sujet' },
  { value: 'other', label: 'Autre problème' },
];

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  closed: 'Fermé',
  wrong_info: 'Infos erronées',
  duplicate: 'Doublon',
  offensive: 'Insultant',
  fake: 'Faux avis',
  off_topic: 'Hors sujet',
  other: 'Autre',
};

/** Comptage des motifs : ['closed', 'closed', 'other'] → « Fermé ×2 · Autre ». */
export function summarizeReasons(reasons: string[]): string {
  const counts = new Map<string, number>();
  for (const reason of reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => {
      const label = REPORT_REASON_LABEL[reason as ReportReason] ?? reason;
      return count > 1 ? `${label} ×${count}` : label;
    })
    .join(' · ');
}
