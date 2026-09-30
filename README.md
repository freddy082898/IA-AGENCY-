# IA-AGENCY — Agence WordPress pilotée par des agents IA

Une équipe de 9 agents Claude Code qui crée et maintient des sites WordPress / WooCommerce,
avec **validation humaine sur Telegram** aux étapes clés.

```
                        Freddy (Telegram)
                   ✅ / ❌  ▲        │ demandes
                           │        ▼
                    ┌──────────────────────┐
                    │   Chef de projet     │  CLAUDE.md
                    └──────────┬───────────┘
   ┌──────────┬──────────┬─────┴─────┬───────────┬──────────┬───────────┬──────────┐
 Brief     Archi UX   Designer   Dév WP    Rédac SEO    QA/Perf   Maintenance  Support
```

| Agent | Rôle |
|---|---|
| Chef de projet | Orchestre, délègue, fait valider (CLAUDE.md) |
| `commercial-brief` | Cahier des charges, devis |
| `architecte-ux` | Arborescence, parcours, thème et plugins |
| `designer` | Charte, maquettes (Canva ou HTML) |
| `developpeur-wp` | Intégration, WooCommerce, code, mise en ligne |
| `redacteur-seo` | Contenus, balises, SEO local, données structurées |
| `qa-performance` | Recette, responsive, Lighthouse, accessibilité |
| `maintenance-securite` | Mises à jour, sauvegardes, sécurité |
| `support-client` | Demandes clients, rapports |

## Commandes

| Commande | Effet |
|---|---|
| `/nouveau-site <client> — <demande>` | Projet complet : brief → devis ✋ → maquettes ✋ → dev → recette → mise en prod ✋ |
| `/audit <url>` | Audit technique, SEO, sécurité, performance (lecture seule) — idéal en prospection |
| `/maintenance <slug\|tous>` | Passage de maintenance + rapport client |
| `/demande-client <slug> — <message>` | Traite une demande client, prépare la réponse |

Tu peux aussi écrire librement au bot Telegram : « Fais un audit de boulangerie-martin.fr ».

## Les 3 niveaux de sécurité

1. **Validations métier** — outil MCP `demander_validation` : devis, maquettes, mise en prod.
   Message Telegram avec boutons ✅ / ❌ ; en cas de refus, ta réponse au message sert de consigne.
2. **Garde-fou automatique** — hook `scripts/hooks/garde-fou.mjs` : toute commande qui écrit
   en production (`wp @client-prod …`), supprime, pousse sur `main`, touche à la base… est
   bloquée jusqu'à ton ✅ sur Telegram. La lecture seule en prod passe sans te déranger.
3. **Permissions Claude Code** — `.claude/settings.json` : secrets illisibles, `sudo` interdit,
   staging autorisé.

Deux bots Telegram distincts :
- **Bot de discussion** : plugin officiel Claude Code *Channels* (tu parles à l'agence).
- **Bot de validation** : `mcp/validation-telegram` (boutons ✅ / ❌).

## Démarrage rapide (sur ton PC)

Prérequis : [Claude Code](https://code.claude.com), Node.js 20+, WP-CLI, accès SSH à tes hébergeurs.

```bash
git clone https://github.com/freddy082898/IA-AGENCY.git && cd IA-AGENCY
cd mcp/validation-telegram && npm install && cd ../..
```

**1. Bot de validation**
- Sur Telegram, ouvre **@BotFather** → `/newbot` → copie le token
- `cp .env.example .env` et colle le token dans `TELEGRAM_VALIDATION_BOT_TOKEN`
- Envoie `/start` à ton nouveau bot, puis :
  `node mcp/validation-telegram/cli.js chat-id` → copie la ligne `TELEGRAM_CHAT_ID=…` dans `.env`
- Test : `node mcp/validation-telegram/cli.js test`

**2. Compétences WordPress officielles** (recommandé)
```bash
npx skills add WordPress/agent-skills
```

**3. Bot de discussion** (optionnel au début, requiert [Bun](https://bun.sh))
```bash
claude
/plugin install telegram@claude-plugins-official
/telegram:configure <token d'un 2e bot BotFather>
/exit
claude --channels plugin:telegram@claude-plugins-official
# écris au bot → il donne un code → /telegram:access pair <code> → /telegram:access policy allowlist
```

**4. Premier client**
- Ajoute ses alias dans `wp-cli.yml` et teste : `wp @client-staging core version`
- Dans Claude Code : `/nouveau-site Boulangerie Martin — site vitrine avec click & collect`

Pour que l'agence tourne en permanence : **[deploy/VPS.md](deploy/VPS.md)**.

## Structure

```
CLAUDE.md                     Chef de projet (règles + workflow)
.claude/agents/               8 agents spécialisés
.claude/commands/             Commandes /nouveau-site, /audit, /maintenance, /demande-client
.claude/settings.json         Permissions + hook garde-fou
.mcp.json                     Serveurs MCP : validation-telegram, playwright
mcp/validation-telegram/      Validation humaine Telegram (serveur MCP + CLI)
scripts/hooks/garde-fou.mjs   Blocage des actions risquées
clients/_modele/              Fiche, journal, modèle de secrets par client
templates/                    Questionnaire, cahier des charges, devis, recette, rapport
wp-cli.yml                    Alias staging / prod des clients
deploy/                       Installation VPS + service systemd
```

## Tests

```bash
# Classification des commandes risquées (16 cas)
node --test scripts/hooks/garde-fou.test.mjs

# Garde-fou en simulation (aucun message envoyé)
echo '{"tool_name":"Bash","tool_input":{"command":"wp @x-prod plugin update --all"}}' \
  | GARDE_FOU_SIMULATION=refuse node scripts/hooks/garde-fou.mjs
```

## Pour aller plus loin

- [WordPress/agent-skills](https://github.com/WordPress/agent-skills) — compétences officielles
- [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) — autres agents à adapter
- [WordPress/mcp-adapter](https://github.com/wordpress/mcp-adapter) — piloter un site via MCP (sans SSH)
- [Claude Code Channels](https://code.claude.com/docs/en/channels) — le canal Telegram officiel
