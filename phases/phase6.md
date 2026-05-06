# Phase 6 — Tests, Déploiement & Soutenance

**Durée estimée** : 2-3 semaines  
**Prérequis** : Phases 1-5 complètes

---

## Objectif général

Finaliser le projet : s'assurer qu'il fonctionne correctement (tests), le déployer (Docker), le documenter, et préparer la soutenance.

---

## Étape 6.1 — Tests Unitaires Backend (JUnit 5 + Mockito)

### Définition
Un **test unitaire** teste une unité de code isolée (une méthode, une classe) en simulant ses dépendances. **Mockito** permet de créer des "faux" objets (mocks) pour simuler les dépendances.

Un test suit le pattern **AAA (Arrange, Act, Assert)** :
- **Arrange** : préparer les données et les mocks
- **Act** : appeler la méthode à tester
- **Assert** : vérifier le résultat

### Questions de compréhension
1. Qu'est-ce qu'un **mock** ? Pourquoi ne pas utiliser la vraie base de données dans les tests unitaires ?
2. Quelle est la différence entre `@Mock` et `@Spy` dans Mockito ?
3. Qu'est-ce que la **couverture de code** (code coverage) ? Un objectif de 100% est-il réaliste/utile ?
4. Qu'est-ce que `@ExtendWith(MockitoExtension.class)` ?

### Dépendances (déjà incluses avec spring-boot-starter-test)
```xml
<!-- JUnit 5 + Mockito + AssertJ déjà inclus -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

### Exemple de test — EmployeeService
```java
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {
    
    @Mock
    private EmployeeRepository employeeRepository;
    
    @Mock
    private DepartmentRepository departmentRepository;
    
    @InjectMocks
    private EmployeeService employeeService;
    
    @Test
    @DisplayName("Devrait retourner tous les employés actifs")
    void shouldReturnAllActiveEmployees() {
        // ARRANGE : préparer les faux données
        Employee employee1 = new Employee();
        employee1.setId(1L);
        employee1.setFirstName("Jean");
        employee1.setLastName("Dupont");
        
        when(employeeRepository.findAll()).thenReturn(List.of(employee1));
        
        // ACT : appeler la méthode
        List<EmployeeResponseDTO> result = employeeService.getAllEmployees();
        
        // ASSERT : vérifier le résultat
        assertThat(result).hasSize(1);
        assertThat(result.get(0).firstName()).isEqualTo("Jean");
        
        // Vérifier que le repository a bien été appelé
        verify(employeeRepository, times(1)).findAll();
    }
    
    @Test
    @DisplayName("Devrait lever une exception si l'employé n'existe pas")
    void shouldThrowExceptionWhenEmployeeNotFound() {
        // ARRANGE
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());
        
        // ACT + ASSERT : la méthode doit lever une exception
        assertThatThrownBy(() -> employeeService.getById(99L))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining("99");
    }
    
    @Test
    @DisplayName("Devrait calculer le salaire net correctement")
    void shouldCalculateNetSalaryCorrectly() {
        // 22% de cotisations → net = brut * 0.78
        BigDecimal gross = new BigDecimal("3000.00");
        BigDecimal expectedNet = new BigDecimal("2340.00");
        
        BigDecimal result = employeeService.calculateNetSalary(gross);
        
        assertThat(result).isEqualByComparingTo(expectedNet);
    }
}
```

### Tests à écrire (priorité)
1. `EmployeeServiceTest` — CRUD + validation
2. `AbsenceServiceTest` — workflow validation, calcul solde, chevauchement dates
3. `SalaryServiceTest` — calcul net/brut, masse salariale
4. `JwtServiceTest` — génération et validation de token

### Lancer les tests
```bash
# Dans IntelliJ : clic droit sur le dossier test > Run All Tests
# Ou en ligne de commande :
./mvnw test

# Rapport de couverture
./mvnw test jacoco:report
# Résultat dans target/site/jacoco/index.html
```

### Livrable
Au moins 10 tests unitaires couvrant les cas nominaux ET les cas d'erreur.

---

## Étape 6.2 — Tests d'Intégration

### Définition
Un **test d'intégration** teste plusieurs composants ensemble (Controller + Service + Repository + DB réelle ou H2 en mémoire). Il vérifie que les composants s'intègrent correctement.

### Questions de compréhension
1. Quelle est la différence entre un test unitaire et un test d'intégration ?
2. Qu'est-ce que `@SpringBootTest` ?
3. Qu'est-ce que `@WebMvcTest` ? Quand l'utiliser vs `@SpringBootTest` ?
4. Qu'est-ce que `MockMvc` ? Comment simuler une requête HTTP dans un test ?

### Exemple — Test du Controller
```java
@WebMvcTest(EmployeeController.class)
class EmployeeControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private EmployeeService employeeService;
    
    @MockBean
    private JwtService jwtService;
    
    @Test
    @DisplayName("GET /api/employees devrait retourner 200 avec la liste")
    @WithMockUser(roles = "ADMIN")
    void shouldReturnEmployeeList() throws Exception {
        // ARRANGE
        when(employeeService.getAllEmployees()).thenReturn(List.of(/* ... */));
        
        // ACT + ASSERT
        mockMvc.perform(get("/api/employees")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
    }
    
    @Test
    @DisplayName("POST /api/employees sans authentification devrait retourner 401")
    void shouldReturn401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/employees")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isUnauthorized());
    }
}
```

### Livrable
Tests d'intégration pour les endpoints principaux.

---

## Étape 6.3 — Déploiement avec Docker

### Définition
**Docker** est un outil de conteneurisation : il package l'application et toutes ses dépendances dans un **conteneur** isolé et portable. **Docker Compose** orchestre plusieurs conteneurs ensemble.

### Questions de compréhension
1. Qu'est-ce qu'une image Docker vs un conteneur Docker ? (Analogie : classe vs instance)
2. Qu'est-ce qu'un `Dockerfile` ? À quoi sert chaque instruction (`FROM`, `COPY`, `RUN`, `CMD`) ?
3. Qu'est-ce que `docker-compose.yml` ? Pourquoi l'utiliser plutôt que lancer chaque conteneur manuellement ?
4. Qu'est-ce qu'un **volume** Docker ? Pourquoi l'utiliser pour la base de données ?

### Dockerfile — Backend Spring Boot
```dockerfile
# Étape 1 : Build avec Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : Image finale légère
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Port exposé
EXPOSE 8080

# Commande de démarrage
CMD ["java", "-jar", "app.jar"]
```

### Dockerfile — Frontend Angular 20
```dockerfile
# Étape 1 : Build Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# Étape 2 : Servir avec Nginx
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx.conf (important pour le routing Angular)
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    
    # Toutes les routes renvoient index.html (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy vers le backend
    location /api/ {
        proxy_pass http://backend:8080;
    }
}
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  
  database:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: hr_manager
      MYSQL_USER: hruser
      MYSQL_PASSWORD: hrpassword
    volumes:
      - mysql_data:/var/lib/mysql  # Persistance des données
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://database:3306/hr_manager
      SPRING_DATASOURCE_USERNAME: hruser
      SPRING_DATASOURCE_PASSWORD: hrpassword
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      database:
        condition: service_healthy
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

### Commandes Docker utiles
```bash
# Construire et démarrer tout
docker-compose up --build

# Vérifier les conteneurs qui tournent
docker-compose ps

# Voir les logs d'un service
docker-compose logs backend

# Arrêter tout
docker-compose down

# Arrêter et supprimer les volumes (reset BDD)
docker-compose down -v
```

### Livrable
Application complète déployable avec `docker-compose up`.

---

## Étape 6.4 — Documentation Swagger/OpenAPI

### Définition
**Swagger/OpenAPI** génère automatiquement une documentation interactive de l'API REST. Elle permet de visualiser et tester tous les endpoints depuis un navigateur.

### Dépendance
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

Accès : `http://localhost:8080/swagger-ui.html`

### Annoter les Controllers pour une meilleure doc
```java
@Operation(summary = "Récupérer tous les employés", description = "Retourne la liste paginée des employés")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Liste récupérée"),
    @ApiResponse(responseCode = "401", description = "Non authentifié")
})
@GetMapping
public ResponseEntity<Page<EmployeeResponseDTO>> getAll(/* ... */) { }
```

### Livrable
Documentation Swagger accessible et complète.

---

## Étape 6.5 — Préparation de la soutenance

### Structure recommandée (20-30 minutes)

**1. Introduction (2 min)**
- Présentation du projet et du problème résolu
- Stack technique choisie et pourquoi

**2. Architecture (5 min)**
- Schéma de l'architecture globale
- Expliquer les couches (Frontend / API / BDD)
- Expliquer le flux d'authentification JWT

**3. Démonstration live (10 min)**
- Login avec différents rôles
- CRUD employés
- Workflow absences (créer → approuver)
- Dashboard + graphiques
- Fonctionnalité IA

**4. Points techniques (5 min)**
- Comment fonctionne le JWT dans ton app ?
- Comment as-tu sécurisé les endpoints par rôle ?
- Comment Angular consomme l'API ?

**5. Difficultés et apprentissages (3 min)**
- Ce qui était difficile et comment tu l'as résolu
- Ce que tu ferais différemment

**6. Questions**

### Questions fréquentes en soutenance — prépare tes réponses

**Sur Spring Boot :**
- "Qu'est-ce que l'injection de dépendances ?"
- "Explique le cycle de vie d'une requête HTTP dans ton app"
- "Pourquoi utiliser JPA plutôt que du SQL direct ?"
- "À quoi sert le @Transactional ?"

**Sur la sécurité :**
- "Qu'est-ce qu'un JWT ? Que contient-il ?"
- "Pourquoi utiliser BCrypt pour les mots de passe ?"
- "Qu'est-ce que CORS ? Pourquoi l'as-tu configuré ?"

**Sur Angular :**
- "Qu'est-ce qu'un Signal en Angular 20 ?"
- "Que fait l'intercepteur HTTP dans ton app ?"
- "Qu'est-ce que le lazy loading ?"

**Sur la base de données :**
- "Quelle est la différence entre une clé primaire et une clé étrangère ?"
- "Qu'est-ce qu'une transaction ?"

**Sur l'IA :**
- "Comment fonctionne l'API que tu as utilisée ?"
- "Quelles sont les limites de ton chatbot ?"
- "Comment gères-tu la confidentialité des données avec l'IA ?"

### Checklist avant la soutenance
- [ ] L'application démarre sans erreur
- [ ] Tous les comptes de test sont créés (admin, manager, employee)
- [ ] La démo fonctionne hors ligne si besoin (docker-compose local)
- [ ] Le rapport est finalisé
- [ ] Les slides sont prêtes
- [ ] J'ai répété la démo au moins 2 fois

---

## Récapitulatif Phase 6

### Livrables finaux
- [ ] 10+ tests unitaires passants
- [ ] Tests d'intégration pour les endpoints principaux
- [ ] Dockerfile backend + frontend
- [ ] docker-compose.yml fonctionnel
- [ ] Documentation Swagger
- [ ] README.md complet (comment lancer le projet)
- [ ] Rapport de projet (introduction, architecture, difficultés, conclusion)
- [ ] Diaporama de soutenance

### README.md minimum
```markdown
# HR Manager — Système de Gestion RH

## Prérequis
- Docker & Docker Compose
- Ou : Java 21, Node.js 20, MySQL 8

## Lancer avec Docker
docker-compose up --build
- Frontend : http://localhost
- Backend API : http://localhost:8080
- Swagger : http://localhost:8080/swagger-ui.html

## Comptes de test
| Rôle    | Email           | Mot de passe |
|---------|-----------------|--------------|
| Admin   | admin@rh.com    | admin123     |
| Manager | manager@rh.com  | manager123   |
| Employé | emp@rh.com      | emp123       |

## Technologies utilisées
...
```
