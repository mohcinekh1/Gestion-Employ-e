# Phase 2 — Backend : Socle Spring Boot + JWT

**Durée estimée** : 2 semaines  
**Prérequis** : Phase 1 complète — base de données créée dans XAMPP

---

## Objectif général

Construire l'API REST sécurisée qui sera le "cerveau" de l'application. À la fin de cette phase, tu auras un backend fonctionnel que tu pourras tester avec Postman.

---

## Étape 2.1 — Initialisation du projet Spring Boot

### Définition
**Spring Boot** est un framework Java qui simplifie la création d'applications web en configurant automatiquement la plupart des composants. Il suit le principe "Convention over Configuration".

**Maven** est l'outil de gestion des dépendances — comme npm pour JavaScript.

### Questions de compréhension
1. Quelle est la différence entre Spring et Spring Boot ?
2. Qu'est-ce qu'une **dépendance** (dependency) dans un projet Java ?
3. À quoi sert le fichier `pom.xml` ?

### À faire — sur Spring Initializr (https://start.spring.io)

Configure ton projet :
- Project : **Maven**
- Language : **Java**
- Spring Boot : **3.x.x**
- Group : `com.hrmanager`
- Artifact : `backend`
- Java : **21**

Dépendances à ajouter — cherche-les et comprends leur rôle avant de les cocher :
- `Spring Web` — pourquoi ?
- `Spring Data JPA` — pourquoi ?
- `MySQL Driver` — pourquoi ?
- `Spring Security` — pourquoi ?
- `Lombok` — pourquoi ?
- `Validation` — pourquoi ?

### Livrable
Projet Spring Boot créé et importé dans ton IDE (IntelliJ IDEA recommandé), qui démarre sans erreur.

---

## Étape 2.2 — Configuration de la base de données

### Définition
Le fichier `application.properties` (ou `application.yml`) contient la configuration de ton application : connexion DB, port, etc.

**JPA (Java Persistence API)** est la norme Java pour mapper des objets Java à des tables SQL. **Hibernate** est l'implémentation utilisée par Spring Boot.

### Questions de compréhension
1. Qu'est-ce que `spring.jpa.hibernate.ddl-auto` ? Quelles valeurs possibles (`create`, `update`, `validate`, `none`) ? Laquelle utiliser en développement ? En production ?
2. Qu'est-ce qu'une **datasource** ?
3. Pourquoi ne jamais mettre son mot de passe MySQL en dur dans un fichier versionné sur Git ?

### À configurer dans `application.properties`
```
# Complète toi-même ces propriétés :
spring.datasource.url=jdbc:mysql://localhost:3306/???
spring.datasource.username=???
spring.datasource.password=???
spring.datasource.driver-class-name=???

spring.jpa.hibernate.ddl-auto=???
spring.jpa.show-sql=???
spring.jpa.properties.hibernate.dialect=???

server.port=8080
```

### Vérification
Lance l'application. Elle doit démarrer sans erreur de connexion à la base de données.

---

## Étape 2.3 — Création des entités JPA

### Définition
Une **entité JPA** est une classe Java annotée `@Entity` qui représente une table en base de données. Chaque instance de cette classe correspond à une ligne de la table.

Les **annotations JPA** clés :
- `@Entity` — cette classe = une table
- `@Id` — cet attribut = la clé primaire
- `@GeneratedValue` — valeur générée automatiquement
- `@Column` — configurer une colonne
- `@ManyToOne`, `@OneToMany` — définir les relations

### Questions de compréhension
1. Qu'est-ce que `@GeneratedValue(strategy = GenerationType.IDENTITY)` ? Quelle autre stratégie existe ?
2. Qu'est-ce que `@Column(nullable = false, unique = true)` signifie concrètement ?
3. Dans une relation `@ManyToOne` (Employee → Department), où met-on la clé étrangère : dans la table Employee ou Department ?
4. Qu'est-ce que `@JsonIgnore` et pourquoi en avoir besoin pour éviter les boucles infinies ?

### Ordre de création recommandé
1. `Department` (aucune dépendance)
2. `Employee` (dépend de Department)
3. `User` (dépend de Employee)
4. `Salary` (dépend de Employee)
5. `Absence` (dépend de Employee)

### Structure de base à compléter
```java
@Entity
@Table(name = "employees")
@Data  // Lombok
public class Employee {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // À toi d'ajouter les autres attributs...
    // Pense à : firstName, lastName, email, phone, hireDate, position, status
    
    @ManyToOne
    @JoinColumn(name = "???")  // Quel nom de colonne ?
    private Department department;
}
```

### Livrable
5 entités créées avec leurs annotations correctes. Vérifier que les tables se créent dans MySQL (avec `ddl-auto=update`).

---

## Étape 2.4 — Repositories JPA

### Définition
Un **Repository** est une interface qui fournit des méthodes pour interagir avec la base de données (CRUD) sans écrire de SQL. Spring Data JPA génère l'implémentation automatiquement.

`JpaRepository<T, ID>` fournit déjà : `findAll()`, `findById()`, `save()`, `deleteById()`, etc.

### Questions de compréhension
1. Qu'est-ce que le pattern **Repository** ? Pourquoi l'utiliser ?
2. Comment Spring Data JPA génère-t-il les requêtes à partir des noms de méthodes comme `findByEmail(String email)` ?
3. Quelle est la différence entre `findById()` qui retourne un `Optional<T>` et `getById()` ?

### À créer
```java
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    // Ajoute les méthodes dont tu auras besoin :
    // - Trouver par email
    // - Trouver par département
    // - Chercher par nom (contenant une chaîne)
}
```

Crée les repositories pour toutes les entités.

### Livrable
5 repositories créés.

---

## Étape 2.5 — DTOs et couche Service

### Définition
**DTO (Data Transfer Object)** : objet utilisé pour transporter des données entre le client et le serveur. On n'expose JAMAIS les entités JPA directement dans l'API pour des raisons de sécurité et de flexibilité.

**Service** : classe qui contient la logique métier. Elle fait le pont entre le Controller (qui reçoit les requêtes) et le Repository (qui accède à la BDD).

### Questions de compréhension
1. Pourquoi ne pas retourner directement une entité `Employee` dans l'API ? Donne 2 raisons.
2. Un EmployeeDTO devrait-il contenir le mot de passe ? Et la liste complète des absences ? Pourquoi ?
3. Quelle est la différence entre un DTO de **réponse** et un DTO de **requête** ?

### À créer

**DTO de réponse** (ce qu'on envoie au client) :
```java
public record EmployeeResponseDTO(
    Long id,
    String firstName,
    String lastName,
    String email,
    // Que d'autre inclure ?
    String departmentName  // Pas l'objet Department entier !
) {}
```

**DTO de requête** (ce qu'on reçoit du client) :
```java
public record EmployeeRequestDTO(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @Email String email,
    // ...
    Long departmentId  // Référence par ID, pas par objet
) {}
```

**Service** :
```java
@Service
public class EmployeeService {
    
    private final EmployeeRepository employeeRepository;
    
    // Utilise inject() en Angular mais en Java on utilise @Autowired ou constructeur
    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    
    public List<EmployeeResponseDTO> getAllEmployees() {
        // À implémenter : récupérer + convertir en DTO
    }
    
    // Implémenter aussi : getById, create, update, delete
}
```

### Livrable
DTOs + Services créés pour Employee. Reproduire pour les autres entités.

---

## Étape 2.6 — Controllers REST

### Définition
Un **Controller REST** reçoit les requêtes HTTP, appelle le Service correspondant, et retourne une réponse HTTP.

Codes HTTP importants à connaître :
- `200 OK` — succès
- `201 Created` — ressource créée
- `400 Bad Request` — données invalides
- `401 Unauthorized` — non authentifié
- `403 Forbidden` — authentifié mais pas autorisé
- `404 Not Found` — ressource inexistante
- `500 Internal Server Error` — erreur serveur

### Questions de compréhension
1. Quelle est la différence entre `@RestController` et `@Controller` ?
2. `@RequestBody` vs `@PathVariable` vs `@RequestParam` — explique chacun avec un exemple.
3. Pourquoi retourner `ResponseEntity<T>` plutôt que directement l'objet ?

### Structure d'un Controller
```java
@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:4200")
public class EmployeeController {
    
    private final EmployeeService employeeService;
    
    // GET /api/employees — liste tous les employés
    @GetMapping
    public ResponseEntity<List<EmployeeResponseDTO>> getAll() {
        // ...
    }
    
    // GET /api/employees/1 — un employé par ID
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> getById(@PathVariable Long id) {
        // ...
    }
    
    // POST /api/employees — créer un employé
    @PostMapping
    public ResponseEntity<EmployeeResponseDTO> create(@Valid @RequestBody EmployeeRequestDTO dto) {
        // ...
    }
    
    // PUT /api/employees/1 — modifier un employé
    // DELETE /api/employees/1 — supprimer un employé
    // À implémenter...
}
```

### Livrable
Controllers CRUD pour toutes les entités + test avec Postman (sans sécurité d'abord).

---

## Étape 2.7 — Authentification JWT

### Définition
**JWT (JSON Web Token)** : token d'authentification composé de 3 parties encodées en Base64 :
1. **Header** : algorithme de chiffrement
2. **Payload** : données (userId, role, expiration)
3. **Signature** : garantit l'intégrité

Fonctionnement : Client → POST /login avec email/password → Serveur valide → Retourne JWT → Client envoie JWT dans chaque requête (Header : `Authorization: Bearer <token>`)

### Questions de compréhension
1. Pourquoi JWT et pas une simple session HTTP ?
2. Le payload JWT est encodé mais pas chiffré — qu'est-ce que ça implique ?
3. Qu'est-ce que l'expiration d'un token ? Que se passe-t-il quand il expire ?
4. Qu'est-ce que le "secret" du JWT ? Pourquoi ne jamais le mettre dans le code ?

### Dépendance à ajouter dans pom.xml
```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
```

### Composants à créer (dans l'ordre)

**1. JwtService** — génère et valide les tokens :
```java
@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secretKey;
    
    public String generateToken(UserDetails userDetails) { /* ... */ }
    public boolean isTokenValid(String token, UserDetails userDetails) { /* ... */ }
    public String extractUsername(String token) { /* ... */ }
}
```

**2. UserDetailsServiceImpl** — charge l'utilisateur depuis la BDD :
```java
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Cherche l'utilisateur en BDD par email
    }
}
```

**3. JwtAuthFilter** — intercepte chaque requête et vérifie le token :
```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
        // 1. Extraire le token du header "Authorization"
        // 2. Valider le token
        // 3. Charger l'utilisateur
        // 4. Mettre l'utilisateur dans le SecurityContext
    }
}
```

**4. SecurityConfig** :
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()  // Login libre
                .requestMatchers("/api/employees/**").hasAnyRole("ADMIN", "MANAGER")
                // À compléter...
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();  // Jamais de MD5 !
    }
}
```

**5. AuthController** — endpoint de connexion :
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        // Authentifier + retourner le JWT
    }
}
```

### Test avec Postman
1. POST /api/auth/login → obtenir un token
2. GET /api/employees → sans token → 401
3. GET /api/employees → avec token → 200

### Livrable
Authentification JWT fonctionnelle, testée avec Postman.

---

## Étape 2.8 — Gestion globale des exceptions

### Définition
Un `@ControllerAdvice` avec `@ExceptionHandler` permet de centraliser la gestion des erreurs et de retourner des réponses cohérentes en cas d'erreur.

### À créer
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        // Retourner les erreurs de validation
    }
    
    // Ajouter d'autres handlers...
}
```

### Livrable
Toutes les erreurs retournent un JSON structuré `{ "code": "...", "message": "..." }`.

---

## Récapitulatif Phase 2

### Livrables
- [ ] Projet Spring Boot qui démarre
- [ ] Connexion MySQL fonctionnelle
- [ ] 5 entités JPA créées
- [ ] 5 repositories
- [ ] DTOs + Services + Controllers CRUD
- [ ] JWT : login, filtre, sécurité
- [ ] Gestion des exceptions
- [ ] Collection Postman avec tous les endpoints testés

### Auto-évaluation
- [ ] Je peux expliquer le cycle complet d'une requête HTTP dans mon app
- [ ] Je comprends comment fonctionne le JWT (génération, validation)
- [ ] Je sais pourquoi on utilise des DTOs
- [ ] Je sais configurer les permissions par rôle dans Spring Security
