# Checklist de recette

## Fonctionnel
- [ ] Toutes les pages du menu répondent (HTTP 200), aucune page « Lorem ipsum » ou de démo
- [ ] Liens internes et externes valides, pas de 404
- [ ] Formulaires : envoi OK, email reçu, message de confirmation, anti-spam actif
- [ ] Recherche du site fonctionnelle
- [ ] Page 404 personnalisée

## WooCommerce (si applicable)
- [ ] Parcours complet en mode test : produit → panier → commande → email de confirmation
- [ ] Variantes, stock, codes promo, frais de livraison, TVA corrects
- [ ] Pages CGV, retours, mentions légales liées au tunnel

## Responsive (375 / 768 / 1440 px)
- [ ] Menu mobile utilisable, pas de débordement horizontal
- [ ] Boutons cliquables (≥ 44 px), textes lisibles (≥ 16 px)

## Performance (Lighthouse mobile)
- [ ] Performance ≥ 80, LCP < 2,5 s, CLS < 0,1
- [ ] Images en WebP/AVIF, dimensionnées, lazy-load ; cache actif

## Accessibilité
- [ ] Score Lighthouse ≥ 90, contrastes AA, attributs alt, navigation clavier, libellés de formulaires

## SEO
- [ ] Title et meta description uniques, un seul H1 par page
- [ ] Sitemap XML accessible, robots.txt correct, site **indexable** en prod
      (« Décourager les moteurs de recherche » décoché)
- [ ] Données structurées valides

## Sécurité & conformité
- [ ] HTTPS partout, pas de contenu mixte
- [ ] `WP_DEBUG` désactivé, `DISALLOW_FILE_EDIT` actif
- [ ] Pas de compte admin « admin », mots de passe forts
- [ ] Bandeau cookies conforme (refus aussi simple que l'acceptation), mentions légales, confidentialité
