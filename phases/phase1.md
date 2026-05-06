# Phase 1 — Analyse & Conception

**Durée estimée** : 1 semaine  
**Prérequis** : Avoir lu et compris le fichier `context.md`

---

## Objectif général

Avant d'écrire une seule ligne de code, comprendre **ce qu'on construit**, **pour qui**, et **comment les données sont organisées**. Un projet sans conception est une maison sans plan.

---

## Étape 1.1 — Identification des acteurs et cas d'utilisation

### Définition
Un **acteur** est une entité externe (personne ou système) qui interagit avec votre application. Un **cas d'utilisation** décrit une action que cet acteur peut accomplir.

### Objectif de l'étape
Produire une liste claire des 3 types d'utilisateurs et de leurs permissions.

### À faire
Remplis ce tableau par toi-même :

| Acteur    | Peut faire | Ne peut PAS faire |
|-----------|-----------|-------------------|
| ADMIN     | ?         | ?                 |
| MANAGER   | ?         | ?                 |
| EMPLOYEE  | ?         | ?                 |

### Questions de compréhension
1. Pourquoi avoir plusieurs rôles plutôt qu'un seul super-utilisateur ?
2. Qu'est-ce que le principe du "moindre privilège" en sécurité informatique ?
3. Qui peut créer un compte employé — l'employé lui-même ou l'admin ?

### Livrable
Un tableau des rôles et permissions complété + un diagramme Use Case (peut être dessiné à la main et photographié).

---

## Étape 1.2 — Diagramme de classes UML

### Définition
Le **diagramme de classes** représente la structure des données de votre application : les entités, leurs attributs, et leurs relations. C'est le "plan" de votre base de données et de votre code Java.

### Objectif de l'étape
Dessiner les 5 entités principales avec leurs attributs et relations.

### Entités à modéliser
- `Employee`
- `Department`
- `Salary`
- `Absence`
- `User`

### Questions de compréhension avant de commencer
1. Quelle est la différence entre une **association**, une **agrégation** et une **composition** en UML ?
2. Qu'est-ce que la **cardinalité** ? Donne un exemple avec Employee et Department.
3. Pourquoi avoir une entité `User` séparée de `Employee` ? Réfléchis : est-ce que tout employé a forcément un compte de connexion ?

### Relations à identifier (trouve-les toi-même)
- Employee ↔ Department : quelle cardinalité ?
- Employee ↔ Salary : une ou plusieurs fiches de salaire ?
- Employee ↔ Absence : un ou plusieurs congés possibles ?
- Employee ↔ User : un employé a-t-il forcément un compte ?

### Livrable
Diagramme de classes UML avec cardinalités (outil suggéré : draw.io, Lucidchart, ou papier).

---

## Étape 1.3 — Modèle Conceptuel de Données (MCD)

### Définition
Le **MCD** (ou ERD en anglais) est la représentation des données du point de vue métier, avant de penser à comment les stocker techniquement. Il utilise les concepts d'**entités**, d'**attributs** et d'**associations**.

### Différence MCD / Diagramme de classes
- MCD = vision **métier** (le quoi)
- Diagramme de classes = vision **technique** (le comment en code)

### Questions de compréhension
1. Qu'est-ce qu'une **clé primaire** ? Pourquoi chaque entité en a-t-elle besoin ?
2. Qu'est-ce qu'une **clé étrangère** ? Donne un exemple concret avec tes entités.
3. Quelle est la différence entre une relation **1-N** et **N-N** ?

### À faire
Pour chaque entité, liste :
- Les attributs avec leur **type** (VARCHAR, INT, DATE, ENUM...)
- La **clé primaire**
- Les **clés étrangères** éventuelles

### Exemple de réflexion guidée
Pour `Absence`, quels attributs sont nécessaires ?
- Une date de début ? Oui, évidemment.
- Une date de fin ? Ou une durée ? Lequel choisir ? Pourquoi ?
- Un statut ? Quelles valeurs possibles ?
- Un lien vers l'employé concerné ? Comment ?

### Livrable
MCD complet de l'application.

---

## Étape 1.4 — Modèle Physique de Données (MPD) et script SQL

### Définition
Le **MPD** est la traduction du MCD en structure de tables réelles MySQL. C'est ce qu'on va réellement créer dans XAMPP.

### Questions de compréhension
1. Comment traduit-on une relation **1-N** en SQL ?
2. Qu'est-ce qu'une **contrainte FOREIGN KEY** ? À quoi sert-elle ?
3. Pourquoi utiliser `VARCHAR(255)` et pas `TEXT` pour un email ?
4. Qu'est-ce que l'`AUTO_INCREMENT` en MySQL ?

### À faire
Rédige le script SQL de création de la base de données avec :
- `CREATE DATABASE hr_manager;`
- `USE hr_manager;`
- `CREATE TABLE` pour chaque entité
- Les contraintes `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`

### Ordre de création important
Réfléchis : dans quel ordre créer les tables ?
Indice : une table qui référence une autre doit être créée APRÈS celle qu'elle référence.

### Vérification dans XAMPP
1. Démarrer Apache et MySQL dans XAMPP
2. Ouvrir phpMyAdmin (http://localhost/phpmyadmin)
3. Exécuter le script SQL
4. Vérifier que toutes les tables ont été créées correctement

### Livrable
Fichier `database/init.sql` avec le script complet + captures d'écran phpMyAdmin.

---

## Étape 1.5 — Maquettes UI (Wireframes)

### Définition
Les **wireframes** sont des maquettes basse fidélité qui représentent la structure des pages de l'application, sans couleurs ni design final. Ils permettent de valider l'expérience utilisateur avant de coder.

### Pages à concevoir
1. Page de connexion (Login)
2. Dashboard (statistiques globales)
3. Liste des employés (tableau avec pagination et recherche)
4. Formulaire ajout/modification d'un employé
5. Page de gestion des absences
6. Page de gestion des salaires

### Questions de compréhension
1. Qu'est-ce que la **pagination** et pourquoi est-elle importante pour une liste d'employés ?
2. Quelles informations sont essentielles à afficher dans un tableau de liste vs une fiche détaillée ?
3. Quels champs du formulaire employé sont **obligatoires** vs **optionnels** ?

### Outil suggéré
- Draw.io (gratuit, en ligne)
- Figma (gratuit pour les bases)
- Même du papier quadrillé !

### Livrable
6 wireframes (format image ou PDF) dans un dossier `wireframes/`.

---

## Récapitulatif Phase 1

### Livrables attendus
- [ ] Tableau des rôles et permissions
- [ ] Diagramme Use Case
- [ ] Diagramme de classes UML
- [ ] MCD de l'application
- [ ] Script SQL `database/init.sql`
- [ ] 6 wireframes UI

### Auto-évaluation — réponds honnêtement
Avant de passer à la Phase 2, es-tu capable de :
- [ ] Expliquer à voix haute la relation entre chaque entité ?
- [ ] Dire quel rôle peut faire quelle action ?
- [ ] Dessiner de mémoire la structure de la table `Employee` ?
- [ ] Expliquer ce qu'est une clé étrangère avec un exemple de ton projet ?

Si tu réponds "non" à l'une de ces questions, reviens sur l'étape correspondante avant de continuer.
