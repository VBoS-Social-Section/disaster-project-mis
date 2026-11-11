/**
 * Who the system belongs to. Shown in the header, the footer and on printed reports.
 *
 * Set these at build time in .env.production.local:
 *   VITE_GOV_NAME     government name (has a default)
 *   VITE_AGENCY_NAME  owning ministry or office, e.g. the disaster management office
 *   VITE_CREST_URL    path to the coat of arms image, e.g. /crest.svg placed in public/
 * Agency and crest are left empty rather than guessed; nothing is shown until they are set.
 */
export const SITE = {
  shortName: "DRMIS",
  government:
    (import.meta.env.VITE_GOV_NAME as string | undefined) ?? "Government of the Republic of Vanuatu",
  agency: (import.meta.env.VITE_AGENCY_NAME as string | undefined) ?? "",
  crestUrl: (import.meta.env.VITE_CREST_URL as string | undefined) ?? "",
} as const;
