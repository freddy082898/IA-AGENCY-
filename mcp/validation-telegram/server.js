#!/usr/bin/env node
// Serveur MCP « validation-telegram » : validations humaines de Freddy via Telegram.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { demanderValidation, notifier } from "./telegram.js";

const serveur = new McpServer({ name: "validation-telegram", version: "1.0.0" });

serveur.registerTool(
  "demander_validation",
  {
    title: "Demander une validation à Freddy",
    description:
      "Envoie une demande de validation sur Telegram (boutons Approuver/Refuser) et attend la réponse. " +
      "Obligatoire avant : envoi d'un devis, validation des maquettes, mise en production, toute action risquée. " +
      "Retourne la décision (approuve | refuse | expire) et le commentaire éventuel.",
    inputSchema: {
      etape: z.enum(["devis", "maquettes", "mise-en-prod", "action-risquee", "autre"]),
      titre: z.string().describe("Client + objet, ex. « Boulangerie Martin — devis site vitrine »"),
      resume: z.string().describe("3 à 6 lignes : ce qu'il faut savoir pour décider (sans secret)"),
      liens: z.array(z.string()).optional().describe("URL staging, maquettes, documents"),
      delai_minutes: z.number().int().min(1).max(1440).optional().describe("Défaut : 60"),
    },
  },
  async ({ etape, titre, resume, liens, delai_minutes }) => {
    try {
      const r = await demanderValidation({ etape, titre, resume, liens, delaiMinutes: delai_minutes ?? 60 });
      const consigne = {
        approuve: "Validé : tu peux continuer.",
        refuse: "Refusé : n'exécute pas. Prends en compte le commentaire, corrige, puis redemande.",
        expire: "Pas de réponse : mets le projet en pause, n'exécute pas l'action.",
      }[r.decision];
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ decision: r.decision, commentaire: r.commentaire || null, consigne }),
        }],
      };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: `Validation impossible (${e.message}). Ne pas exécuter l'action ; demander à Freddy dans le terminal.` }],
      };
    }
  }
);

serveur.registerTool(
  "notifier",
  {
    title: "Notifier Freddy",
    description: "Envoie un message d'information sur Telegram (jalon atteint, livrable prêt, incident). N'attend pas de réponse.",
    inputSchema: { message: z.string() },
  },
  async ({ message }) => {
    try {
      await notifier(message);
      return { content: [{ type: "text", text: "Notification envoyée." }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `Échec de la notification : ${e.message}` }] };
    }
  }
);

await serveur.connect(new StdioServerTransport());
