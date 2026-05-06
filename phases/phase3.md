# Phase 3 — Backend : Modules Métier

**Durée estimée** : 2 semaines  
**Prérequis** : Phase 2 complète — API REST + JWT fonctionnels

---

## Objectif général

Implémenter les fonctionnalités métier spécifiques RH : gestion des salaires, des absences et congés, et les statistiques globales.

---

## Étape 3.1 — Module Gestion des Salaires

### Définition
La gestion des salaires implique de stocker l'**historique** des rémunérations d'un employé, de calculer les montants nets/bruts, et de générer des documents (fiches de paie).

### Questions de compréhension
1. Pourquoi garder un **historique** des salaires plutôt qu'un seul champ "salaire actuel" ?
2. Qu'est-ce que la différence entre **salaire brut** et **salaire net** ? Quelles cotisations existent ?
3. Un employé peut-il voir le salaire d'un autre employé ? Quelle règle de sécurité applique-t-on ?

### Endpoints à créer
```
GET    /api/salaries/employee/{employeeId}   → Historique des salaires d'un employé
POST   /api/salaries                          → Ajouter une fiche de salaire
GET    /api/salaries/{id}                     → Détail d'une fiche
PUT    /api/salaries/{id}                     → Modifier
DELETE /api/salaries/{id}                     → Supprimer (avec confirmation)
GET    /api/salaries/employee/{id}/latest     → Salaire actuel
GET    /api/salaries/stats/department/{deptId}→ Masse salariale par département
```

### SalaryService — logique à implémenter
```java
@Service
public class SalaryService {
    
    // Récupérer l'historique trié par date décroissante
    public List<SalaryResponseDTO> getEmployeeSalaryHistory(Long employeeId) {
        // Pense à vérifier que l'employé existe
        // Trier par effectiveDate DESC
    }
    
    // Calculer le salaire net à partir du brut
    // Règle simplifiée : net = brut * 0.78 (22% de cotisations)
    public BigDecimal calculateNetSalary(BigDecimal grossSalary) {
        // ...
    }
    
    // Calculer la masse salariale d'un département
    public BigDecimal getDepartmentSalaryMass(Long departmentId) {
        // Sommer les salaires actuels de tous les employés du département
    }
}
```

### Génération PDF — Fiche de paie (optionnel mais valorisant)

Ajouter dans `pom.xml` :
```xml
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itextpdf</artifactId>
    <version>5.5.13.3</version>
</dependency>
```

Endpoint :
```
GET /api/salaries/{id}/pdf → Retourne le PDF en téléchargement
```

Questions :
- Quel `Content-Type` retourner pour un PDF ?
- Comment forcer le navigateur à télécharger plutôt qu'afficher ?
  Indice : header `Content-Disposition: attachment; filename="..."`

### Livrable
CRUD salaires + calcul net/brut + stats masse salariale.

---

## Étape 3.2 — Module Gestion des Absences et Congés

### Définition
Une **absence** est un événement déclaré par un employé (ou l'admin) avec un type, des dates, et un **workflow de validation** : l'absence passe par les états EN_ATTENTE → APPROUVE ou REFUSE.

### Questions de compréhension
1. Qu'est-ce qu'un **workflow** ? Dessine le diagramme d'états de l'entité `Absence`.
2. Qui peut approuver une demande ? Seulement MANAGER et ADMIN ?
3. Que se passe-t-il si deux absences d'un même employé se chevauchent ? Doit-on le gérer ?
4. Comment calculer le **solde de congés** restant d'un employé (ex: 30 jours par an) ?

### Endpoints à créer
```
GET    /api/absences/employee/{employeeId}    → Absences d'un employé
GET    /api/absences/pending                  → Toutes les absences EN_ATTENTE (MANAGER/ADMIN)
POST   /api/absences                          → Créer une demande d'absence
PUT    /api/absences/{id}/approve             → Approuver (MANAGER/ADMIN)
PUT    /api/absences/{id}/reject              → Refuser avec motif
GET    /api/absences/employee/{id}/balance    → Solde de congés restant
```

### AbsenceService — logique à implémenter
```java
@Service
public class AbsenceService {
    
    // Créer une demande — valider les dates
    public AbsenceResponseDTO createAbsence(AbsenceRequestDTO dto) {
        // Vérifications :
        // 1. La date de fin est après la date de début ?
        // 2. L'employé a-t-il assez de jours restants ?
        // 3. Chevauchement avec une autre absence ?
    }
    
    // Approuver une absence
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public AbsenceResponseDTO approveAbsence(Long absenceId) {
        // Vérifier que le statut est EN_ATTENTE
        // Changer le statut → APPROUVE
        // Décrémenter le solde de congés de l'employé
    }
    
    // Calculer le solde restant
    public int getRemainingBalance(Long employeeId, int year) {
        // Total annuel (ex: 30) - jours d'absences APPROUVEES cette année
    }
    
    // Calculer le nombre de jours ouvrés entre deux dates
    private long calculateWorkingDays(LocalDate start, LocalDate end) {
        // Ne pas compter les weekends !
        // Les jours fériés ? (optionnel avancé)
    }
}
```

### Sécurité par rôle
```java
// Dans le Controller, utiliser @PreAuthorize :
@PutMapping("/{id}/approve")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public ResponseEntity<AbsenceResponseDTO> approve(@PathVariable Long id) {
    // ...
}
```

Pour activer @PreAuthorize, ajouter `@EnableMethodSecurity` sur `SecurityConfig`.

### Livrable
CRUD absences + workflow de validation + calcul de solde.

---

## Étape 3.3 — Statistiques et Tableau de Bord

### Définition
Les statistiques agrègent les données pour donner une **vue synthétique** de l'état RH de l'entreprise. Ces données alimenteront les graphiques du frontend.

### Questions de compréhension
1. Qu'est-ce qu'une **requête d'agrégation** en SQL (`COUNT`, `SUM`, `AVG`, `GROUP BY`) ?
2. Pourquoi éviter de charger tous les employés en mémoire pour calculer une statistique ?
3. Qu'est-ce que le **taux d'absentéisme** et comment le calculer ?

### Endpoint à créer
```
GET /api/stats/dashboard
```

Réponse attendue :
```json
{
  "totalEmployees": 45,
  "employeesByDepartment": [
    { "departmentName": "IT", "count": 12 },
    { "departmentName": "RH", "count": 8 }
  ],
  "totalSalaryMass": 185000.00,
  "averageSalary": 4111.11,
  "pendingAbsences": 7,
  "absenceRateThisMonth": 4.2,
  "recentHires": [ ... ]  // 5 derniers recrutés
}
```

### Utiliser des requêtes JPQL personnalisées
```java
// Dans EmployeeRepository
@Query("SELECT d.name, COUNT(e) FROM Employee e JOIN e.department d GROUP BY d.name")
List<Object[]> countByDepartment();

// Dans SalaryRepository
@Query("SELECT SUM(s.amount) FROM Salary s WHERE s.type = 'MENSUEL' AND s.employee.status = 'ACTIF'")
BigDecimal getTotalSalaryMass();
```

### DashboardService
```java
@Service
public class DashboardService {
    
    public DashboardDTO getDashboardStats() {
        // Agréger toutes les statistiques
        // Convertir en DTO
        // Attention aux performances : ne pas faire N+1 queries !
    }
}
```

### Problème N+1 queries
Avant d'implémenter, réfléchis :
- Si tu as 50 départements et que pour chaque département tu fais une requête pour compter les employés, combien de requêtes SQL en tout ?
- Comment éviter ça avec une seule requête `GROUP BY` ?

### Livrable
Endpoint `/api/stats/dashboard` fonctionnel retournant toutes les statistiques.

---

## Étape 3.4 — Export Excel/CSV

### Définition
L'export de données est une fonctionnalité essentielle en entreprise. Apache POI permet de générer des fichiers Excel `.xlsx` depuis Java.

### Questions de compréhension
1. Quelle est la différence entre un fichier `.csv` et `.xlsx` ?
2. Quel `Content-Type` HTTP utiliser pour chacun ?
3. Pourquoi l'export peut-il être lent si on a beaucoup de données ? Comment optimiser ?

### Dépendance à ajouter
```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.5</version>
</dependency>
```

### Endpoints
```
GET /api/employees/export/excel   → Télécharger la liste en .xlsx
GET /api/employees/export/csv     → Télécharger la liste en .csv
```

### ExportService — structure
```java
@Service
public class ExportService {
    
    public ByteArrayInputStream exportEmployeesToExcel(List<Employee> employees) {
        // Créer un Workbook
        // Créer une feuille
        // Créer une ligne d'en-tête
        // Remplir les données
        // Retourner en ByteArrayInputStream
    }
    
    public String exportEmployeesToCsv(List<Employee> employees) {
        // Format : "id;firstName;lastName;email;department\n"
        // Pour chaque employé, ajouter une ligne
    }
}
```

### Livrable
Export Excel et CSV fonctionnels, téléchargeables depuis Postman.

---

## Étape 3.5 — Pagination et Recherche

### Définition
La **pagination** divise une grande liste en pages pour éviter de charger toutes les données d'un coup. Spring Data JPA gère ça avec `Pageable`.

### Questions de compréhension
1. Qu'est-ce que `Pageable` dans Spring Data JPA ?
2. Quelle est la différence entre `Page<T>` et `Slice<T>` ?
3. Pourquoi la pagination côté serveur est meilleure que côté client pour 10 000 employés ?

### Modifier le Repository et Controller
```java
// Repository
Page<Employee> findByFirstNameContainingOrLastNameContaining(
    String firstName, String lastName, Pageable pageable
);

// Controller
@GetMapping
public ResponseEntity<Page<EmployeeResponseDTO>> getAll(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(defaultValue = "lastName") String sortBy,
    @RequestParam(required = false) String search
) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
    // ...
}
```

Appel API : `GET /api/employees?page=0&size=10&sortBy=lastName&search=dupont`

### Livrable
Liste employés paginée avec recherche par nom.

---

## Récapitulatif Phase 3

### Livrables
- [ ] CRUD Salaires avec calcul net/brut
- [ ] Export PDF fiche de paie (ou prévu pour plus tard)
- [ ] CRUD Absences avec workflow de validation
- [ ] Calcul de solde de congés
- [ ] Statistiques dashboard
- [ ] Export Excel/CSV
- [ ] Pagination et recherche

### Auto-évaluation
- [ ] Je comprends le workflow d'une absence (états et transitions)
- [ ] Je sais écrire une requête JPQL avec GROUP BY
- [ ] Je comprends comment fonctionne la pagination avec Pageable
- [ ] Je sais utiliser @PreAuthorize pour sécuriser par rôle
