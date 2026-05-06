# Phase 5 — Module Intelligence Artificielle

**Durée estimée** : 1 semaine  
**Prérequis** : Phases 2, 3 et 4 complètes — application fonctionnelle

---

## Objectif général

Intégrer au moins une fonctionnalité IA dans l'application RH. L'IA doit apporter une vraie valeur ajoutée, pas être un gadget.

---

## Choix de la fonctionnalité IA (tu dois en choisir au moins 1)

### Option A — Chatbot RH (recommandée)
Un assistant conversationnel qui répond aux questions des employés sur les congés, salaires, procédures RH.

### Option B — Résumé de profil employé
Générer automatiquement un résumé professionnel d'un employé à partir de ses données.

### Option C — Analyse des données RH (avancé)
Analyser les tendances d'absences et suggérer des actions.

---

## Étape 5.1 — Comprendre les LLMs et les APIs IA

### Définition
Un **LLM (Large Language Model)** est un modèle d'IA entraîné sur de grandes quantités de texte. Il peut comprendre et générer du texte naturel.

**API IA** : interface pour utiliser un LLM hébergé (OpenAI, Anthropic, etc.) sans avoir à entraîner le modèle soi-même. On envoie un **prompt** (question/instruction) et on reçoit une réponse.

### Concepts clés à comprendre
1. **Prompt** : le texte d'entrée envoyé au modèle
2. **System prompt** : instructions de comportement données au modèle
3. **Tokens** : unité de mesure du texte (≈ ¾ de mot en anglais)
4. **Temperature** : contrôle la créativité (0 = déterministe, 1 = créatif)
5. **Context window** : quantité maximale de texte que le modèle peut traiter

### Questions de compréhension
1. Qu'est-ce qu'un **prompt système** ? Donne un exemple pour un assistant RH.
2. Pourquoi ne jamais mettre la clé API dans le code ou sur GitHub ?
3. Qu'est-ce que le **streaming** de réponse IA ? Avantage par rapport à attendre la réponse complète ?
4. Quelle est la différence entre un modèle `gpt-4o` et `gpt-4o-mini` ? Quand utiliser lequel ?

---

## Étape 5.2 — Configuration Spring AI (Backend)

### Dépendance à ajouter
```xml
<!-- Pour OpenAI -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Configuration dans application.properties
```properties
# Ne JAMAIS hardcoder la clé ici — utiliser une variable d'environnement !
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.options.model=gpt-4o-mini
spring.ai.openai.chat.options.temperature=0.7
spring.ai.openai.chat.options.max-tokens=1000
```

### Comment définir la variable d'environnement ?
```bash
# Sur Windows
set OPENAI_API_KEY=sk-...

# Sur Mac/Linux
export OPENAI_API_KEY=sk-...

# Ou dans IntelliJ : Run > Edit Configurations > Environment variables
```

---

## Étape 5.3A — Chatbot RH

### Définition
Un **chatbot** est une interface conversationnelle. L'historique de la conversation est envoyé à chaque requête pour que le modèle garde le contexte.

### Questions de compréhension
1. Pourquoi doit-on envoyer tout l'historique de conversation à chaque message ?
2. Qu'est-ce qu'un **message système** vs **message utilisateur** vs **message assistant** ?
3. Comment limiter les coûts si l'historique devient très long ?

### Backend — ChatService
```java
@Service
public class HRChatService {
    
    private final ChatClient chatClient;
    
    // System prompt qui définit le comportement du chatbot
    private static final String SYSTEM_PROMPT = """
        Tu es un assistant RH virtuel pour l'entreprise.
        Tu aides les employés avec leurs questions sur :
        - Les congés et absences (procédures, soldes, délais)
        - Les fiches de paie et salaires (dates de paiement, compréhension)
        - Les politiques internes de l'entreprise
        
        Règles importantes :
        - Tu NE donnes PAS les informations confidentielles (salaires des autres, données personnelles)
        - Tu restes professionnel et bienveillant
        - Si tu ne sais pas, dis-le et oriente vers le service RH
        - Tu réponds en français
        """;
    
    public HRChatService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }
    
    public String chat(String userMessage, List<MessageDTO> history) {
        // Construire les messages avec l'historique
        // Appeler l'API
        // Retourner la réponse
    }
    
    // Version avec streaming (plus fluide)
    public Flux<String> chatStream(String userMessage, List<MessageDTO> history) {
        return chatClient.prompt()
            .system(SYSTEM_PROMPT)
            .messages(convertHistory(history))
            .user(userMessage)
            .stream()
            .content();
    }
}
```

### Controller
```java
@RestController
@RequestMapping("/api/ai")
public class ChatController {
    
    private final HRChatService chatService;
    
    @PostMapping("/chat")
    public ResponseEntity<ChatResponseDTO> chat(@RequestBody ChatRequestDTO request) {
        String response = chatService.chat(request.message(), request.history());
        return ResponseEntity.ok(new ChatResponseDTO(response));
    }
    
    // Streaming avec Server-Sent Events
    @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@RequestParam String message) {
        return chatService.chatStream(message, List.of());
    }
}
```

### Frontend — ChatComponent Angular 20
```typescript
@Component({
  selector: 'app-chat',
  standalone: true,
  template: `
    <div class="chat-container">
      <div class="messages">
        @for (msg of messages(); track $index) {
          <div [class]="msg.role === 'user' ? 'message user' : 'message assistant'">
            {{ msg.content }}
          </div>
        }
        @if (loading()) {
          <div class="message assistant typing">...</div>
        }
      </div>
      
      <div class="input-area">
        <mat-form-field>
          <input matInput [(ngModel)]="currentMessage" 
                 (keydown.enter)="sendMessage()"
                 placeholder="Posez votre question RH...">
        </mat-form-field>
        <button mat-icon-button (click)="sendMessage()" [disabled]="loading()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `
})
export class ChatComponent {
  private chatService = inject(ChatService);
  
  messages = signal<Message[]>([]);
  currentMessage = '';
  loading = signal(false);
  
  sendMessage(): void {
    if (!this.currentMessage.trim()) return;
    
    const userMsg = { role: 'user', content: this.currentMessage };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.currentMessage = '';
    this.loading.set(true);
    
    this.chatService.chat(userMsg.content, this.messages()).subscribe({
      next: (response) => {
        this.messages.update(msgs => [...msgs, { role: 'assistant', content: response.message }]);
        this.loading.set(false);
      }
    });
  }
}
```

### Livrable
Chatbot RH fonctionnel avec historique de conversation.

---

## Étape 5.3B — Résumé de profil employé

### Questions de compréhension
1. Comment structurer un prompt pour obtenir une sortie cohérente et professionnelle ?
2. Pourquoi est-il risqué d'inclure des données sensibles (salaire, données médicales) dans un prompt envoyé à une API externe ?

### Backend — ProfileSummaryService
```java
@Service
public class ProfileSummaryService {
    
    private final ChatClient chatClient;
    private final EmployeeRepository employeeRepository;
    private final SalaryRepository salaryRepository;
    private final AbsenceRepository absenceRepository;
    
    public String generateEmployeeSummary(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new EntityNotFoundException("Employé non trouvé"));
        
        // Construire le contexte (SANS données sensibles comme le salaire)
        String context = """
            Génère un résumé professionnel concis (3-4 phrases) pour cet employé :
            - Nom : %s %s
            - Poste : %s
            - Département : %s
            - Date d'embauche : %s
            - Ancienneté : %d ans
            
            Le résumé doit être professionnel, positif, et mettre en valeur l'ancienneté.
            """.formatted(
                employee.getFirstName(), employee.getLastName(),
                employee.getPosition(),
                employee.getDepartment().getName(),
                employee.getHireDate(),
                calculateSeniority(employee.getHireDate())
            );
        
        return chatClient.prompt()
            .user(context)
            .call()
            .content();
    }
}
```

### Endpoint
```
GET /api/ai/employees/{id}/summary
```

### Frontend — Bouton "Générer résumé" sur la fiche employé
```typescript
generateSummary(employeeId: number): void {
  this.aiService.getEmployeeSummary(employeeId).subscribe({
    next: (summary) => this.employeeSummary.set(summary),
    error: () => this.showError('Erreur lors de la génération')
  });
}
```

### Livrable
Génération de résumé IA sur la fiche d'un employé.

---

## Étape 5.4 — Gestion des erreurs et limites de l'IA

### Questions de compréhension
1. Que se passe-t-il si l'API IA est indisponible ? Comment gérer ce cas ?
2. Qu'est-ce que le **rate limiting** ? Comment l'API OpenAI le gère ?
3. Qu'est-ce que le **hallucination** d'un LLM ? Comment minimiser ce risque dans un contexte RH ?

### Bonnes pratiques à implémenter
```java
// Toujours entourer les appels IA d'un try-catch
try {
    String response = chatClient.prompt().user(message).call().content();
    return response;
} catch (OpenAiHttpException e) {
    if (e.statusCode == 429) {
        throw new AiRateLimitException("Trop de requêtes, réessayez dans quelques secondes");
    }
    throw new AiServiceException("Service IA temporairement indisponible");
}
```

---

## Récapitulatif Phase 5

### Livrables
- [ ] Au moins 1 fonctionnalité IA choisie et implémentée
- [ ] Clé API sécurisée (variable d'environnement)
- [ ] Gestion des erreurs API
- [ ] Interface utilisateur pour la fonctionnalité IA

### Auto-évaluation
- [ ] Je peux expliquer ce qu'est un LLM en 2 phrases simples
- [ ] Je comprends pourquoi ne pas mettre la clé API dans le code
- [ ] Je sais ce qu'est un prompt système et comment il influence le comportement
- [ ] Je comprends les risques des LLMs (hallucination, coût, confidentialité)
