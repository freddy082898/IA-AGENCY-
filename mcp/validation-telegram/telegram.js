// Bibliothèque partagée : envoi de demandes de validation sur Telegram et attente de la réponse.
// Utilisée par le serveur MCP (server.js) et par le hook garde-fou (scripts/hooks/garde-fou.mjs).
import { readFileSync, mkdirSync, rmdirSync, statSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, "..", "..");

// Charge le fichier .env à la racine du dépôt (sans dépendance externe).
function chargerEnv() {
  try {
    const contenu = readFileSync(join(RACINE, ".env"), "utf8");
    for (const ligne of contenu.split(/\r?\n/)) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* pas de .env : on utilise l'environnement */
  }
}
chargerEnv();

export function config() {
  const token = process.env.TELEGRAM_VALIDATION_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error(
      "TELEGRAM_VALIDATION_BOT_TOKEN et TELEGRAM_CHAT_ID doivent être définis (voir .env.example)"
    );
  }
  return { token, chatId: String(chatId) };
}

async function api(methode, corps) {
  const { token } = config();
  const rep = await fetch(`${process.env.TELEGRAM_API_BASE ?? "https://api.telegram.org"}/bot${token}/${methode}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corps ?? {}),
  });
  const json = await rep.json();
  if (!json.ok) throw new Error(`Telegram ${methode} : ${json.description ?? rep.status}`);
  return json.result;
}

const echapper = (t) =>
  String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ICONES = {
  devis: "💶",
  maquettes: "🎨",
  "mise-en-prod": "🚀",
  "action-risquee": "⚠️",
  autre: "📝",
};

// Verrou simple entre processus : une seule demande en attente à la fois,
// sinon deux processus se « voleraient » les réponses (getUpdates).
async function avecVerrou(fn, attenteMaxMs) {
  const verrou = join(tmpdir(), "ia-agency-telegram.lock");
  const debut = Date.now();
  for (;;) {
    try {
      mkdirSync(verrou);
      break;
    } catch {
      // verrou abandonné depuis plus de 30 min : on le récupère
      try {
        if (Date.now() - statSync(verrou).mtimeMs > 30 * 60_000) rmdirSync(verrou);
      } catch {}
      if (Date.now() - debut > attenteMaxMs) throw new Error("Une autre validation est déjà en attente");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  try {
    return await fn();
  } finally {
    try { rmdirSync(verrou); } catch {}
  }
}

export async function notifier(texte) {
  const { chatId } = config();
  await api("sendMessage", {
    chat_id: chatId,
    text: `🤖 <b>IA-AGENCY</b>\n${echapper(texte)}`,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

/**
 * Envoie une demande de validation avec boutons ✅ / ❌ et attend la réponse.
 * @returns {Promise<{decision: "approuve"|"refuse"|"expire", commentaire: string}>}
 */
export async function demanderValidation({ etape = "autre", titre, resume, liens = [], delaiMinutes = 60 }) {
  const { chatId } = config();
  const delaiMs = Math.max(1, delaiMinutes) * 60_000;

  return avecVerrou(async () => {
    const id = randomBytes(4).toString("hex");
    const lignesLiens = liens.length
      ? "\n\n🔗 " + liens.map((l) => echapper(l)).join("\n🔗 ")
      : "";
    const texte =
      `${ICONES[etape] ?? "📝"} <b>Validation — ${echapper(etape)}</b>\n` +
      `<b>${echapper(titre)}</b>\n\n${echapper(resume)}${lignesLiens}\n\n` +
      `<i>Réponds à ce message pour ajouter un commentaire. Expire dans ${Math.round(delaiMs / 60000)} min.</i>`;

    // Ignore les anciennes mises à jour en attente.
    const anciennes = await api("getUpdates", { offset: -1, timeout: 0 });
    let offset = anciennes.length ? anciennes[anciennes.length - 1].update_id + 1 : 0;

    const msg = await api("sendMessage", {
      chat_id: chatId,
      text: texte,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ Approuver", callback_data: `ok:${id}` },
          { text: "❌ Refuser", callback_data: `no:${id}` },
        ]],
      },
    });

    const fin = Date.now() + delaiMs;
    let decision = null;
    let commentaire = "";
    let finAttenteCommentaire = null;

    while (Date.now() < (finAttenteCommentaire ?? fin)) {
      const restant = Math.floor(((finAttenteCommentaire ?? fin) - Date.now()) / 1000);
      const maj = await api("getUpdates", {
        offset,
        timeout: Math.max(1, Math.min(25, restant)),
        allowed_updates: ["callback_query", "message"],
      });
      for (const u of maj) {
        offset = u.update_id + 1;
        // Sécurité : on n'accepte que les réponses venant du chat autorisé.
        const cq = u.callback_query;
        if (cq && String(cq.message?.chat?.id) === chatId && cq.data?.endsWith(`:${id}`)) {
          decision = cq.data.startsWith("ok:") ? "approuve" : "refuse";
          await api("answerCallbackQuery", {
            callback_query_id: cq.id,
            text: decision === "approuve" ? "Approuvé ✅" : "Refusé ❌",
          }).catch(() => {});
          await api("editMessageReplyMarkup", {
            chat_id: chatId,
            message_id: msg.message_id,
            reply_markup: { inline_keyboard: [] },
          }).catch(() => {});
          if (decision === "refuse" && !commentaire) {
            await api("sendMessage", {
              chat_id: chatId,
              text: "❌ Refusé. Pourquoi ? Réponds au message de validation (2 min), sinon je continue sans commentaire.",
              reply_to_message_id: msg.message_id,
            }).catch(() => {});
            finAttenteCommentaire = Date.now() + 120_000;
          }
        }
        const m = u.message;
        if (m && String(m.chat?.id) === chatId && m.reply_to_message?.message_id === msg.message_id && m.text) {
          commentaire = commentaire ? `${commentaire}\n${m.text}` : m.text;
          if (decision) finAttenteCommentaire = Date.now(); // on a tout ce qu'il faut
        }
      }
      if (decision === "approuve" || (decision === "refuse" && commentaire)) break;
    }

    // Confirme les mises à jour lues pour ne pas les retraiter.
    await api("getUpdates", { offset, timeout: 0 }).catch(() => {});

    if (!decision) {
      await api("editMessageReplyMarkup", {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: { inline_keyboard: [] },
      }).catch(() => {});
      await api("sendMessage", {
        chat_id: chatId,
        text: "⌛ Demande expirée : l'action n'a pas été réalisée.",
        reply_to_message_id: msg.message_id,
      }).catch(() => {});
      return { decision: "expire", commentaire };
    }
    return { decision, commentaire };
  }, delaiMs);
}
