# Contexte du Projet — Système de Gestion des Employés

## Identité du projet
- **Nom** : HR Manager — Système RH Full Stack
- **Objectif pédagogique** : Apprendre à construire une application full stack professionnelle avec Spring Boot, Angular et une fonctionnalité IA
- **Niveau** : Étudiant en informatique (niveau intermédiaire)
- **Mode** : L'étudiant réalise le travail lui-même. Cursor joue le rôle d'un **mentor Socratique** : il guide, pose des questions, explique les concepts, mais ne génère pas le code à la place de l'étudiant sauf si explicitement demandé.

---

## Stack technique

| Couche       | Technologie          | Version      |
|--------------|----------------------|--------------|
| Backend      | Spring Boot          | 3.x          |
| Langage      | Java                 | 21           |
| Base données | MySQL via XAMPP      | 8.x          |
| Frontend     | Angular              | 20           |
| Sécurité     | Spring Security + JWT | —           |
| IA           | OpenAI API / Spring AI | —          |
| Build        | Maven                | —            |

---

## Architecture du projet

```
hr-manager/
├── backend/                  # Projet Spring Boot (Maven)
│   ├── src/main/java/com/hrmanager/
│   │   ├── config/           # SecurityConfig, JwtConfig, CORS
│   │   ├── controller/       # REST Controllers
│   │   ├── service/          # Business Logic
│   │   ├── repository/       # JPA Repositories
│   │   ├── entity/           # Entités JPA
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── security/         # JWT Filter, UserDetailsService
│   │   └── ai/               # Module IA
│   └── src/main/resources/
│       └── application.properties
│
└── frontend/                 # Projet Angular 20
    └── src/app/
        ├── core/             # Guards, Interceptors, Services partagés
        ├── features/
        │   ├── auth/         # Login
        │   ├── employees/    # CRUD Employés
        │   ├── salaries/     # Gestion Salaires
        │   ├── absences/     # Congés et Absences
        │   └── dashboard/    # Statistiques
        └── shared/           # Composants partagés
```

---

## Modèle de données principal

- **Employee** : id, firstName, lastName, email, phone, hireDate, position, department, status
- **Department** : id, name, description, manager
- **Salary** : id, employee, amount, effectiveDate, type (MENSUEL/ANNUEL)
- **Absence** : id, employee, startDate, endDate, type, status (EN_ATTENTE/APPROUVE/REFUSE)
- **User** : id, username, password, role (ADMIN/MANAGER/EMPLOYEE), employee

---

## Règles métier
1. Un employé appartient à un seul département
2. Seul un ADMIN peut créer/supprimer des employés
3. Un MANAGER peut approuver/refuser les absences de son département
4. Un EMPLOYEE peut seulement voir ses propres données
5. Tout accès à l'API nécessite un JWT valide (sauf /api/auth/**)

---

## Phases du projet

| Fichier              | Contenu                                      |
|----------------------|----------------------------------------------|
| phases/phase1.md     | Analyse, conception, UML, BDD                |
| phases/phase2.md     | Backend — Socle Spring Boot + JWT            |
| phases/phase3.md     | Backend — Modules métier (salaires, absences)|
| phases/phase4.md     | Frontend Angular 20                          |
| phases/phase5.md     | Module IA                                    |
| phases/phase6.md     | Tests, déploiement, soutenance               |

---

## Conventions de code

### Backend (Java)
- camelCase pour variables/méthodes, PascalCase pour les classes
- Toujours utiliser des DTOs pour les échanges API
- Validation avec @Valid et annotations Jakarta Validation
- Gestion des exceptions avec @ControllerAdvice

### Frontend (Angular 20)
- Utiliser les Standalone Components (pas de NgModule)
- Utiliser les Signals pour la gestion d'état local
- Utiliser inject() au lieu du constructeur pour les dépendances
- Utiliser le nouveau control flow (@if, @for, @switch)
- Lazy loading pour chaque feature
