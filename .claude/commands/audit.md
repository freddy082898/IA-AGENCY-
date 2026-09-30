---
description: Audit complet d'un site WordPress existant (technique, sécurité, SEO, performance) — idéal en avant-vente
argument-hint: <URL du site> [slug client]
---

Audit de : $ARGUMENTS

Sans aucune modification du site (lecture seule) :

1. `qa-performance` : Lighthouse mobile + desktop, responsive, formulaires, liens cassés.
2. `redacteur-seo` : audit SEO (indexation, balises, Hn, contenus, SEO local).
3. `maintenance-securite` : ce qui est visible de l'extérieur (version WordPress exposée,
   plugins détectables, HTTPS, en-têtes de sécurité, pages sensibles accessibles).
   Si des accès WP-CLI existent : état complet en lecture seule.
4. Synthèse dans `clients/<slug>/audit-<date>.md` :
   - Note globale /10 et 5 priorités classées par impact
   - Tableau : problème, risque pour le client, solution, effort (jours)
   - Une proposition commerciale courte (refonte, optimisation ou maintenance)
5. `notifier` Freddy avec la note et les 3 points principaux.
