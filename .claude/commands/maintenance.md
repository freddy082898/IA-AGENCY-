---
description: Passage de maintenance mensuel sur un client ou sur tous les clients
argument-hint: <slug client | tous>
---

Maintenance pour : $ARGUMENTS

1. Si « tous » : liste les dossiers de `clients/` (hors `_modele`) dont `client.md` indique
   « Maintenance : oui ». Sinon, prends le client indiqué.
2. Pour chaque client, délègue à `maintenance-securite` le passage de maintenance complet
   (état → sauvegarde → mises à jour → contrôle → sécurité). Les commandes d'écriture en
   production déclencheront automatiquement une validation Telegram : regroupe-les pour
   limiter le nombre de demandes (ex. `wp @<slug>-prod plugin update a b c`).
3. Puis `support-client` rédige le rapport client depuis `templates/rapport-maintenance.md`
   dans `clients/<slug>/rapports/<AAAA-MM>.md`.
4. `notifier` Freddy : un bilan d'une ligne par client (OK / à surveiller / incident).
