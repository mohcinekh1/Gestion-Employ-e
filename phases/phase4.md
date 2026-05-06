# Phase 4 — Frontend Angular 20

**Durée estimée** : 3 semaines  
**Prérequis** : Phase 2 complète (API REST + JWT fonctionnels)

---

## Objectif général

Construire l'interface utilisateur Angular 20 qui consomme l'API Spring Boot. Cette version d'Angular introduit des changements majeurs : Standalone Components, Signals, et nouveau control flow.

---

## Étape 4.1 — Initialisation du projet Angular 20

### Définition
**Angular 20** est un framework frontend basé sur TypeScript. Il utilise une architecture en **composants** : chaque partie de l'interface est un composant réutilisable avec son template HTML, ses styles CSS, et sa logique TypeScript.

### Nouveautés Angular 20 à connaître avant de commencer
1. **Standalone Components** : plus de NgModule, chaque composant est autonome
2. **Signals** : nouveau système de réactivité pour la gestion d'état
3. **Nouveau control flow** : `@if`, `@for`, `@switch` au lieu de `*ngIf`, `*ngFor`
4. **inject()** : fonction pour injecter les dépendances (au lieu du constructeur)

### Questions de compréhension
1. Qu'est-ce qu'un **composant** Angular ? Quels sont ses 3 fichiers ?
2. Qu'est-ce que la **data binding** ? Différence entre `[property]`, `(event)` et `[(ngModel)]` ?
3. Qu'est-ce qu'un **service** Angular et pourquoi le séparer du composant ?
4. Qu'est-ce que le **routing** ? Pourquoi parle-t-on de SPA (Single Page Application) ?

### Commandes d'initialisation
```bash
# Installer Angular CLI si pas encore fait
npm install -g @angular/cli

# Créer le projet
ng new frontend --routing --style=scss --standalone

# Aller dans le dossier
cd frontend

# Installer Angular Material (UI components)
ng add @angular/material

# Lancer le serveur de développement
ng serve
```

### Structure à créer
```
src/app/
├── core/
│   ├── guards/           auth.guard.ts, role.guard.ts
│   ├── interceptors/     auth.interceptor.ts
│   ├── services/         auth.service.ts
│   └── models/           employee.model.ts, ...
├── features/
│   ├── auth/             login.component.ts
│   ├── dashboard/        dashboard.component.ts
│   ├── employees/        liste + formulaire
│   ├── salaries/         liste + formulaire
│   └── absences/         liste + formulaire
└── shared/
    └── components/       navbar, sidebar, ...
```

### Livrable
Projet Angular 20 qui démarre sur `http://localhost:4200`.

---

## Étape 4.2 — Modèles TypeScript et Services HTTP

### Définition
Les **modèles** (interfaces TypeScript) définissent la structure des données échangées avec l'API. Les **services HTTP** font les appels à l'API Spring Boot.

### Questions de compréhension
1. Quelle est la différence entre une `interface` et un `type` en TypeScript ?
2. Pourquoi définir les modèles TypeScript ? Peut-on s'en passer ?
3. Qu'est-ce qu'un `Observable` RxJS ? Comment est-ce différent d'une `Promise` ?
4. Qu'est-ce que `HttpClient` et comment l'injecter dans un service ?

### Modèles à créer
```typescript
// core/models/employee.model.ts
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;  // ISO date string
  position: string;
  status: 'ACTIF' | 'INACTIF' | 'CONGE';
  departmentName: string;
}

export interface EmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  // Compléter...
  departmentId: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
```

### EmployeeService avec Signals
```typescript
// features/employees/employee.service.ts
@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/employees';
  
  // Signal pour stocker la liste des employés
  employees = signal<Employee[]>([]);
  loading = signal(false);
  
  getAll(page = 0, size = 10, search = ''): Observable<PageResponse<Employee>> {
    return this.http.get<PageResponse<Employee>>(this.apiUrl, {
      params: { page, size, search }
    });
  }
  
  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }
  
  create(employee: EmployeeRequest): Observable<Employee> {
    // À implémenter
  }
  
  update(id: number, employee: EmployeeRequest): Observable<Employee> {
    // À implémenter
  }
  
  delete(id: number): Observable<void> {
    // À implémenter
  }
}
```

### Livrable
Services HTTP créés pour Employee, Salary, Absence, Department.

---

## Étape 4.3 — Authentification côté client

### Définition
L'**authentification frontend** gère : le formulaire de login, le stockage du JWT, l'envoi automatique du token avec chaque requête (intercepteur), et la protection des pages (guard).

### Questions de compréhension
1. Où stocker le JWT côté client ? `localStorage` vs `sessionStorage` vs cookie — avantages/inconvénients ?
2. Qu'est-ce qu'un **HTTP Interceptor** ? Comment fonctionne-t-il ?
3. Qu'est-ce qu'un **Route Guard** ? Difference entre `CanActivate` et `CanMatch` ?
4. Comment décoder un JWT côté client pour lire le rôle de l'utilisateur ?

### AuthService
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Signals pour l'état d'auth
  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        // Décoder le token et mettre à jour currentUser
      })
    );
  }
  
  logout(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
  
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  // Décoder le JWT pour extraire les infos
  private decodeToken(token: string): any {
    // Le payload JWT est en Base64 — utiliser atob() ou jwt-decode
  }
}
```

### Intercepteur HTTP (auth.interceptor.ts)
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }
  
  return next(req);
};
```

Questions :
- Où enregistrer cet intercepteur ? (dans `app.config.ts`)
- Que faire si l'API retourne une erreur 401 ? (Déconnecter automatiquement)

### Route Guard
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/login']);
};
```

### Livrable
Login fonctionnel + token stocké + intercepteur actif + garde de route.

---

## Étape 4.4 — Page de connexion (Login)

### Questions de compréhension
1. Qu'est-ce que **Reactive Forms** en Angular ? Différence avec Template-driven Forms ?
2. Qu'est-ce que `FormBuilder`, `FormGroup`, `FormControl` ?
3. Comment afficher un message d'erreur de validation ?

### Composant Login (Standalone)
```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, /* ... */],
  template: `
    <div class="login-container">
      <mat-card>
        <h2>Connexion RH</h2>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <mat-form-field>
            <input matInput formControlName="email" placeholder="Email" type="email">
            @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
              <mat-error>L'email est requis</mat-error>
            }
          </mat-form-field>
          
          <mat-form-field>
            <input matInput formControlName="password" placeholder="Mot de passe" type="password">
          </mat-form-field>
          
          @if (errorMessage()) {
            <div class="error">{{ errorMessage() }}</div>
          }
          
          <button mat-raised-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
      </mat-card>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  errorMessage = signal('');
  loading = signal(false);
  
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  
  onSubmit(): void {
    if (this.loginForm.invalid) return;
    
    this.loading.set(true);
    this.authService.login(this.loginForm.value as LoginRequest).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage.set('Email ou mot de passe incorrect');
        this.loading.set(false);
      }
    });
  }
}
```

### Livrable
Page login fonctionnelle qui redirige vers le dashboard.

---

## Étape 4.5 — Layout principal (Navbar + Sidebar)

### Questions de compréhension
1. Qu'est-ce que `<router-outlet>` ? Quel est son rôle ?
2. Comment cacher un élément de menu selon le rôle de l'utilisateur connecté ?
3. Qu'est-ce que `MatSidenav` dans Angular Material ?

### Structure du layout
```typescript
// app.component.ts — Layout principal
@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    @if (authService.isAuthenticated()) {
      <mat-sidenav-container>
        <mat-sidenav mode="side" opened>
          <app-sidebar />
        </mat-sidenav>
        <mat-sidenav-content>
          <app-navbar />
          <main>
            <router-outlet />
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <router-outlet />
    }
  `
})
```

### Livrable
Layout avec navigation fonctionnelle, liens actifs, déconnexion.

---

## Étape 4.6 — Module Employés (CRUD complet)

### Questions de compréhension
1. Comment implémenter le **tri** d'un tableau Angular Material ?
2. Comment implémenter la **pagination** côté client avec `MatPaginator` ?
3. Qu'est-ce qu'un **dialog** Angular Material (`MatDialog`) ? Comment l'utiliser pour un formulaire ?

### Composants à créer
1. `EmployeeListComponent` — tableau avec recherche, tri, pagination
2. `EmployeeFormComponent` — formulaire ajout/modification (dialog)
3. `EmployeeDetailComponent` — fiche détaillée (optionnel)

### EmployeeListComponent
```typescript
@Component({ ... })
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private dialog = inject(MatDialog);
  
  // Signals
  employees = signal<Employee[]>([]);
  totalElements = signal(0);
  loading = signal(false);
  searchQuery = signal('');
  
  // Pagination
  pageSize = 10;
  currentPage = 0;
  
  ngOnInit(): void {
    this.loadEmployees();
  }
  
  loadEmployees(): void {
    this.loading.set(true);
    this.employeeService.getAll(this.currentPage, this.pageSize, this.searchQuery())
      .subscribe({
        next: (data) => {
          this.employees.set(data.content);
          this.totalElements.set(data.totalElements);
          this.loading.set(false);
        }
      });
  }
  
  openAddDialog(): void {
    const dialogRef = this.dialog.open(EmployeeFormComponent, {
      width: '600px',
      data: null  // null = création, sinon = modification
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadEmployees();  // Recharger si sauvegardé
    });
  }
  
  openEditDialog(employee: Employee): void {
    // À implémenter
  }
  
  deleteEmployee(id: number): void {
    // Confirmation avant suppression
  }
}
```

### Template avec nouveau control flow
```html
<div class="employees-container">
  <!-- Barre de recherche -->
  <mat-form-field>
    <input matInput placeholder="Rechercher un employé..." 
           [value]="searchQuery()"
           (input)="onSearch($event)">
  </mat-form-field>
  
  <button mat-raised-button color="primary" (click)="openAddDialog()">
    + Ajouter un employé
  </button>
  
  <!-- Tableau -->
  @if (loading()) {
    <mat-spinner />
  } @else {
    <table mat-table [dataSource]="employees()">
      <!-- Colonnes à définir : nom, prénom, email, département, statut, actions -->
      
      @for (employee of employees(); track employee.id) {
        <!-- Chaque ligne -->
      }
    </table>
    
    <mat-paginator
      [length]="totalElements()"
      [pageSize]="pageSize"
      (page)="onPageChange($event)">
    </mat-paginator>
  }
</div>
```

### Livrable
CRUD employés complet avec tableau, pagination, formulaire en dialog.

---

## Étape 4.7 — Dashboard avec graphiques

### Questions de compréhension
1. Qu'est-ce que `ng2-charts` (Chart.js wrapper pour Angular) ?
2. Quels types de graphiques sont adaptés pour : répartition par département, évolution des absences, masse salariale ?

### Installer Chart.js
```bash
npm install ng2-charts chart.js
```

### DashboardComponent
```typescript
@Component({ ... })
export class DashboardComponent implements OnInit {
  private statsService = inject(StatsService);
  
  stats = signal<DashboardStats | null>(null);
  
  // Données pour les graphiques
  departmentChartData = computed(() => ({
    labels: this.stats()?.employeesByDepartment.map(d => d.departmentName) ?? [],
    datasets: [{
      data: this.stats()?.employeesByDepartment.map(d => d.count) ?? [],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
    }]
  }));
  
  ngOnInit(): void {
    this.statsService.getDashboard().subscribe(data => this.stats.set(data));
  }
}
```

### Template dashboard
```html
<div class="dashboard-grid">
  <!-- KPI Cards -->
  <mat-card class="kpi-card">
    <mat-card-title>Total employés</mat-card-title>
    <span class="kpi-value">{{ stats()?.totalEmployees }}</span>
  </mat-card>
  
  <!-- Graphique Donut — Répartition par département -->
  <mat-card>
    <canvas baseChart [data]="departmentChartData()" type="doughnut"></canvas>
  </mat-card>
  
  <!-- Graphique Barres — Masse salariale -->
  <!-- Ajouter d'autres graphiques... -->
</div>
```

### Livrable
Dashboard avec au moins 3 KPI cards et 2 graphiques.

---

## Étape 4.8 — Modules Salaires et Absences

Appliquer le même pattern que pour les employés :
- Liste avec tableau filtrable
- Formulaire de création/modification
- Actions spécifiques (approuver/refuser pour les absences)

### Spécificité — Workflow des absences
Le bouton "Approuver" / "Refuser" ne doit apparaître que si :
- L'utilisateur connecté a le rôle ADMIN ou MANAGER
- Le statut de l'absence est EN_ATTENTE

```typescript
// Computed basé sur les Signals
canApprove = computed(() => {
  const role = this.authService.currentUser()?.role;
  return role === 'ADMIN' || role === 'MANAGER';
});
```

### Livrable
Modules Salaires et Absences fonctionnels.

---

## Récapitulatif Phase 4

### Livrables
- [ ] Projet Angular 20 opérationnel
- [ ] Auth : login, JWT, intercepteur, guards
- [ ] Layout : navbar, sidebar, routing
- [ ] CRUD Employés complet
- [ ] CRUD Salaires
- [ ] CRUD Absences + workflow
- [ ] Dashboard avec graphiques

### Auto-évaluation
- [ ] Je comprends les Signals et leur différence avec les variables classiques
- [ ] Je sais expliquer le flux complet : click login → token → requête API → affichage
- [ ] Je comprends le rôle de l'intercepteur HTTP
- [ ] Je sais créer un formulaire réactif avec validation
