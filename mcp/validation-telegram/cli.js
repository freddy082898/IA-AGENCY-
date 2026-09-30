#!/usr/bin/env node
// Outils en ligne de commande :
//   node mcp/validation-telegram/cli.js chat-id   → affiche ton chat id (après avoir écrit /start au bot)
//   node mcp/validation-telegram/cli.js test      → envoie une notification + une validation de test
import { demanderValidation, notifier } from "./telegram.js";

const action = process.argv[2];

if (action === "chat-id") {
  const token = process.env.TELEGRAM_VALIDATION_BOT_TOKEN;
  if (!token) {
    console.error("Renseigne d'abord TELEGRAM_VALIDATION_BOT_TOKEN dans .env");
    process.exit(1);
  }
  const rep = await fetch(`https://api.telegram.org/bot${token}/getUpdates`).then((r) => r.json());
  const chats = new Map();
  for (const u of rep.result ?? []) {
    const c = u.message?.chat;
    if (c) chats.set(c.id, `${c.first_name ?? ""} ${c.last_name ?? ""} @${c.username ?? "?"}`.trim());
  }
  if (!chats.size) console.log("Aucun message trouvé : envoie /start à ton bot sur Telegram puis relance.");
  for (const [id, nom] of chats) console.log(`TELEGRAM_CHAT_ID=${id}   (${nom})`);
} else if (action === "test") {
  await notifier("Test de notification : la connexion fonctionne.");
  console.log("Notification envoyée. Réponds à la demande de validation sur Telegram…");
  const r = await demanderValidation({
    etape: "autre",
    titre: "Test IA-AGENCY",
    resume: "Ceci est un test. Clique sur un bouton.",
    liens: [],
    delaiMinutes: 5,
  });
  console.log("Réponse reçue :", r);
} else {
  console.log("Usage : node mcp/validation-telegram/cli.js <chat-id|test>");
}
