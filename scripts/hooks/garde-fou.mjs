#!/usr/bin/env node
// Hook PreToolUse « garde-fou » : toute commande Bash risquée (production, destruction,
// publication) est soumise à Freddy sur Telegram avant exécution.
// Entrée : JSON du hook sur stdin. Sortie : décision allow / deny / ask (JSON sur stdout).

// --- Classification -------------------------------------------------------

// Sous-commandes WP-CLI en lecture seule (autorisées en prod sans validation).
const WP_LECTURE = [
  /^core (version|check-update|verify-checksums|is-installed)\b/,
  /^plugin (list|status|get|is-active|is-installed|verify-checksums|search)\b/,
  /^theme (list|status|get|is-active|is-installed)\b/,
  /^(option|user|post|term|comment|menu|role|site|transient) (get|list)\b/,
  /^db (export|size|tables|check)\b/,
  /^config (get|list|has)\b/,
  /^cron event list\b/,
  /^(cli (version|info)|help)\b/,
];

const DANGER_GENERAL = [
  [/\brm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+)+/, "suppression de fichiers (rm -r/-f)"],
  [/\bsudo\b/, "commande sudo"],
  [/\bgit\s+push\b.*(--force|-f\b|\+)/, "git push forcé"],
  [/\bgit\s+push\b.*\b(main|master|production|prod)\b/, "git push sur une branche principale"],
  [/\bgit\s+reset\s+--hard\b/, "git reset --hard"],
  [/\b(curl|wget)\b[^|]*\|\s*(ba|z)?sh\b/, "exécution d'un script téléchargé"],
  [/\bchmod\s+(-R\s+)?777\b/, "chmod 777"],
  [/\bwp\b.*\bdb\s+(reset|drop|clean|import)\b/, "opération destructive sur la base de données"],
  [/\b(mysql|mariadb)\b.*\b(drop|truncate|delete)\b/i, "requête SQL destructive"],
];

const CHAINAGE = /[;&|`]|\$\(|>/;

/** @returns {{risque: boolean, lecture?: boolean, raison?: string}} */
export function classer(commande) {
  const cmd = String(commande || "").trim();

  for (const [motif, raison] of DANGER_GENERAL) {
    if (motif.test(cmd)) return { risque: true, raison };
  }

  // Commandes WP-CLI visant la production : alias @xxx-prod ou --ssh=...prod...
  const vise_prod = /\bwp\b[^\n]*(@[\w.-]+-prod\b|--ssh=\S*prod)/.test(cmd);
  if (vise_prod) {
    if (CHAINAGE.test(cmd)) return { risque: true, raison: "commande composée visant la production" };
    const sous = cmd
      .replace(/^.*?\bwp\s+/, "")
      .replace(/(@[\w.-]+|--ssh=\S+|--path=\S+|--url=\S+|--skip-\S+|--quiet)\s*/g, "")
      .trim();
    if (/^search-replace\b/.test(sous) && /--dry-run\b/.test(sous)) return { risque: false, lecture: true };
    if (WP_LECTURE.some((m) => m.test(sous))) return { risque: false, lecture: true };
    return { risque: true, raison: `écriture en production : wp ${sous.slice(0, 80)}` };
  }

  return { risque: false };
}

// --- Exécution du hook ------------------------------------------------------

function repondre(decision, raison) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: raison,
      },
    })
  );
  process.exit(0);
}

async function lireStdin() {
  let d = "";
  for await (const c of process.stdin) d += c;
  return d;
}

async function main() {
  let entree;
  try {
    entree = JSON.parse(await lireStdin());
  } catch {
    process.exit(0); // entrée illisible : on laisse le flux normal de permissions
  }
  if (entree.tool_name !== "Bash") process.exit(0);

  const commande = entree.tool_input?.command ?? "";
  const { risque, lecture, raison } = classer(commande);
  if (lecture) repondre("allow", "Lecture seule en production : autorisé par le garde-fou.");
  if (!risque) process.exit(0); // pas d'avis : règles de permission habituelles

  // Mode simulation pour les tests : GARDE_FOU_SIMULATION=approuve|refuse|expire
  let r;
  const simu = process.env.GARDE_FOU_SIMULATION;
  if (simu) {
    r = { decision: simu, commentaire: "simulation" };
  } else {
    try {
      const { demanderValidation } = await import("../../mcp/validation-telegram/telegram.js");
      r = await demanderValidation({
        etape: "action-risquee",
        titre: raison,
        resume:
          `Commande :\n${commande.slice(0, 600)}\n\n` +
          `Justification de l'agent : ${entree.tool_input?.description ?? "—"}`,
        delaiMinutes: Number(process.env.GARDE_FOU_DELAI_MINUTES ?? 14),
      });
    } catch (e) {
      // Telegram indisponible : on retombe sur la confirmation dans le terminal.
      repondre("ask", `Garde-fou : validation Telegram impossible (${e.message}). Confirmation manuelle requise : ${raison}.`);
    }
  }

  if (r.decision === "approuve") repondre("allow", `Approuvé par Freddy sur Telegram (${raison}).`);
  if (r.decision === "refuse")
    repondre("deny", `Refusé par Freddy sur Telegram. Commentaire : ${r.commentaire || "aucun"}. N'essaie pas de contourner ; adapte ton plan.`);
  repondre("deny", `Pas de réponse de Freddy dans le délai (${raison}). Action non réalisée : mets la tâche en pause et notifie-le.`);
}

import { pathToFileURL } from "node:url";
import { realpathSync } from "node:fs";
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
