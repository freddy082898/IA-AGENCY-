---
description: Traite une demande reçue d'un client (email, message) et prépare la réponse
argument-hint: <slug client> — <demande collée>
---

Demande client : $ARGUMENTS

Délègue à `support-client` : qualifier la demande, la traiter ou la router selon sa méthode,
et rédiger le brouillon de réponse dans `clients/<slug>/messages/`.
Si une action en production est nécessaire, elle passe par le garde-fou (validation Telegram).
Termine par `notifier` : résumé de la demande, action faite ou proposée, brouillon prêt.
