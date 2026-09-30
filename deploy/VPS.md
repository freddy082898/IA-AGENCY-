# Faire tourner l'agence 24 h/24 (VPS)

## Pourquoi un VPS ?

Un **VPS** (serveur privé virtuel) est un petit ordinateur Linux loué dans un datacenter,
allumé en permanence et accessible à distance. L'agence y tourne jour et nuit : tu envoies
tes demandes et tu valides depuis Telegram, même quand ton PC est éteint.

**Pour commencer, tu n'en as pas besoin** : tout fonctionne sur ton propre ordinateur
tant qu'il est allumé (voir README, « Démarrage rapide »). Le VPS vient ensuite.

## Choisir un VPS

- Système : **Ubuntu 24.04 LTS**
- Taille suffisante : 2 vCPU, 4 Go de RAM, 40 Go de disque
- Hébergeurs courants : Hetzner, OVHcloud, Scaleway, Hostinger (compter quelques euros par mois ;
  vérifie les tarifs actuels)
- Choisis un datacenter en France ou en Europe (RGPD)

À la commande, ajoute ta clé SSH publique (ou note le mot de passe root envoyé par email).

## Installation (≈ 15 min)

```bash
# 1. Depuis ton PC : connexion au serveur
ssh root@<IP-du-VPS>

# 2. Installation automatique
curl -fsSL https://raw.githubusercontent.com/freddy082898/IA-AGENCY/main/deploy/install-vps.sh | bash
```

> Si le dépôt est privé, clone-le d'abord (`git clone` avec un token GitHub) puis lance
> `bash IA-AGENCY/deploy/install-vps.sh`.

Le script installe Node.js, WP-CLI, Bun, Claude Code, Chromium (tests), un pare-feu,
fail2ban, et crée l'utilisateur `agence` (l'agence ne tourne jamais en root).

## Configuration

```bash
su - agence

# Clé à autoriser chez chaque hébergeur client (cPanel → Accès SSH → Gérer les clés)
cat ~/.ssh/id_ed25519.pub

cd ~/IA-AGENCY
cp .env.example .env && nano .env        # token du bot de validation + chat id
node mcp/validation-telegram/cli.js test # vérifie la validation Telegram

claude                                   # 1re fois : connexion à ton compte Claude
# Dans Claude Code :
#   /plugin install telegram@claude-plugins-official
#   /telegram:configure <token du bot de discussion>
#   /exit
exit
```

Puis, en root :

```bash
systemctl enable --now ia-agency   # démarre l'agence et la relance au redémarrage
```

Appairage Telegram (une seule fois) : écris à ton bot de discussion, il répond un code ;
sur le VPS : `su - agence`, `tmux attach -t agence`, tape `/telegram:access pair <code>`
puis `/telegram:access policy allowlist`, et détache-toi avec **Ctrl+B puis D**.

## Au quotidien

| Action | Commande |
|---|---|
| Voir la session | `tmux attach -t agence` (quitter : Ctrl+B puis D) |
| Redémarrer | `sudo systemctl restart ia-agency` |
| Mettre à jour l'agence | `cd ~/IA-AGENCY && git pull` puis redémarrer |
| Mettre à jour Claude Code | automatique (installateur natif) |

## Sécurité

- Le VPS détient les clés SSH de tes clients : mots de passe désactivés, connexion par clé
  uniquement, mises à jour de sécurité automatiques (`apt install unattended-upgrades`).
- Les bots Telegram sont restreints à ton compte (liste blanche + chat id).
- Sauvegarde le dossier `clients/` (il est dans git, hors secrets).
