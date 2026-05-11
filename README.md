# Gestion employés

Application web **Angular** + API **Spring Boot** + base **MySQL** (compatible **XAMPP** sur Windows).

Après un `git clone`, aucun autre projet ni configuration cachée n’est nécessaire : démarrer MySQL, puis le backend, puis le frontend.

---

## Prérequis

| Outil | Version conseillée |
|--------|-------------------|
| **JDK** | **21** (LTS recommandé) |
| **Maven** | 3.8+ (ou build depuis IntelliJ / Eclipse) |
| **Node.js** | 20 LTS (avec **npm**) |
| **MySQL** | Via **XAMPP** : module **MySQL** actif (port **3306** par défaut) |

---

## 1. MySQL (XAMPP)

1. Installer [XAMPP](https://www.apachefriends.org/) si besoin.
2. Ouvrir le **panneau de contrôle XAMPP** et démarrer **MySQL** (Apache est optionnel pour ce projet).
3. Configuration attendue par défaut (déjà dans `backend/src/main/resources/application.properties`) :
   - Hôte : `localhost`
   - Port : `3306`
   - Utilisateur : `root`
   - Mot de passe : **vide** (comportement habituel de XAMPP sous Windows)

Si votre utilisateur `root` a un **mot de passe**, définir la variable d’environnement avant de lancer le backend (Spring Boot la prend en charge automatiquement) :

**Windows (PowerShell)**  
`$env:SPRING_DATASOURCE_PASSWORD = "votreMotDePasse"`

**Windows (cmd)**  
`set SPRING_DATASOURCE_PASSWORD=votreMotDePasse`

### Base de données

- La base **`hr_manager`** est créée automatiquement au premier démarrage du backend (`createDatabaseIfNotExist=true`).
- Les **tables** sont créées ou mises à jour par **Hibernate** (`spring.jpa.hibernate.ddl-auto=update`).

Le fichier `database/init.sql` sert de **référence** ou d’import manuel ; **il n’est pas obligatoire** pour un premier lancement si vous laissez Hibernate gérer le schéma.

---

## 2. Backend (API)

```bash
cd backend
mvn spring-boot:run
```

L’API écoute sur **http://localhost:8080** (chemins sous `/api/...`).

Arrêt : `Ctrl+C` dans le terminal.

---

## 3. Frontend (interface)

Dans un **second** terminal :

```bash
cd frontend
npm install
npm start
```

Puis ouvrir **http://localhost:4200** dans le navigateur.

Le fichier `frontend/proxy.conf.json` redirige les appels `/api` vers `http://localhost:8080` pendant le développement : **pas besoin** de modifier l’URL de l’API en local.

---

## 4. Comptes créés au premier démarrage

Le composant `ReferenceDataBootstrap` crée les départements et des comptes administrateur si la base est vide :

| Identifiant | Mot de passe | Rôle |
|-------------|--------------|------|
| `admin` (ou e-mail `admin@hrmanager.local`) | `Admin123!` | ADMIN |
| `admin@gmail.com` | `123456789` | ADMIN (démo) |

Vous pouvez aussi utiliser l’écran **Créer un compte employé** pour un compte `EMPLOYEE`.

---

## Dépannage rapide

- **Erreur de connexion à la base** : vérifier que MySQL XAMPP est bien **démarré** et sur le port **3306**.
- **Accès refusé MySQL (mot de passe)** : utiliser `SPRING_DATASOURCE_PASSWORD` ou adapter `spring.datasource.username` / `password` dans `application.properties`.
- **Le frontend ne rejoint pas l’API** : le backend doit tourner sur le port **8080** ; lancer le frontend avec `npm start` (profil avec proxy).
- **CORS** : en développement, les origines `http://localhost:4200` et `http://127.0.0.1:4200` sont autorisées.

---

## Structure du dépôt

- `backend/` — Spring Boot, `pom.xml`, `src/main/resources/application.properties`
- `frontend/` — Angular, `package.json`, `proxy.conf.json`
- `database/` — scripts SQL optionnels (`init.sql`, etc.)
