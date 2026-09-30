---
description: Lance un projet de création de site WordPress de A à Z (brief → mise en ligne)
argument-hint: <nom du client> — <demande en quelques mots>
---

Nouveau projet client : $ARGUMENTS

Déroule le workflow « nouveau site » de CLAUDE.md :

1. Crée le slug client et le dossier `clients/<slug>/` à partir de `clients/_modele/`
   (copie `client.md` et un `journal.md` vide). Ajoute les alias `@<slug>-staging` et
   `@<slug>-prod` dans `wp-cli.yml` s'ils sont connus, sinon note-le dans « Questions ».
2. Délègue à `commercial-brief`. S'il manque des informations bloquantes, envoie les questions
   à Freddy avec `notifier` et arrête-toi là.
3. ✋ `demander_validation` étape `devis` avec le résumé du commercial.
4. Si approuvé : `architecte-ux` puis `designer`.
5. ✋ `demander_validation` étape `maquettes` avec les liens.
6. Si approuvé : `developpeur-wp` et `redacteur-seo` en parallèle, sur staging.
7. `qa-performance` ; boucle de corrections (max 3 tours, puis notifie Freddy).
8. ✋ `demander_validation` étape `mise-en-prod` avec lien staging + verdict QA + scores.
9. Si approuvé : mise en ligne par `developpeur-wp`, contrôle prod par `qa-performance`.
10. `notifier` : site en ligne, récapitulatif, et ajout au planning de maintenance.

À chaque étape : une ligne dans `clients/<slug>/journal.md`.
En cas de refus : intègre le commentaire, corrige, et redemande la même validation.
