# API Documentation - PostSmartAI Backend

## Vue d'ensemble

PostSmartAI est une API RESTful Laravel 11 conçue pour les conseillers clientèle de La Poste. Elle permet la gestion de l'authentification, de la génération d'e-mails via IA, de l'historique des e-mails et de la base de connaissances.

## Configuration

### Installation des dépendances

```bash
composer install
```

### Variables d'environnement

Copiez `.env.example` en `.env` et configurez-le :

```
APP_NAME="PostSmartAI"
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=postsmartai
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:5173
```

### Migrations et seeders

```bash
php artisan migrate
php artisan db:seed
```

Cela crée :
- 1 administrateur (admin@postsmartai.com / password)
- 2 managers
- 10 conseillers
- 50-150 emails historiques
- 10 documents de base de connaissances

## Authentification (API Sanctum)

Toutes les routes (sauf `/api/login` et `/api/register`) sont protégées par `auth:sanctum`.

### Endpoints d'authentification

#### POST /api/login
Connecter un utilisateur

**Requête:**
```json
{
  "email": "user@postsmartai.com",
  "password": "password"
}
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "email": "...", "role": "conseiller" },
    "token": "1|8wDsq9o4..."
  },
  "errors": null
}
```

#### POST /api/register
Créer un nouvel utilisateur (admin only)

**Requête:**
```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean@postsmartai.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "conseiller"
}
```

#### GET /api/user
Récupérer le profil de l'utilisateur connecté

#### POST /api/logout
Déconnecter l'utilisateur

## Gestion des emails (Email History)

### GET /api/email-histories
Lister les emails (paginé par 15)

**Query Parameters:**
- `status`: draft, sent, modified
- `start_date`, `end_date`: filtrer par date (YYYY-MM-DD)
- `client_email`: email du client
- `per_page`: nombre d'éléments par page (défaut: 15)

**Réponse:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "user_id": 2,
        "client_email": "client@example.com",
        "subject": "...",
        "content": "...",
        "status": "draft",
        "created_at": "2024-04-17T...",
        "updated_at": "2024-04-17T..."
      }
    ],
    "current_page": 1,
    "total": 50
  }
}
```

### POST /api/email-histories
Créer un nouvel email (status: draft par défaut)

**Requête:**
```json
{
  "client_email": "client@example.com",
  "client_name": "John Doe",
  "subject": "Sujet de l'email",
  "content": "Contenu de l'email..."
}
```

### GET /api/email-histories/{id}
Récupérer un email spécifique

### PATCH /api/email-histories/{id}
Mettre à jour un email (autorisé pour l'auteur ou admin)

**Requête:**
```json
{
  "subject": "Nouveau sujet",
  "content": "Nouveau contenu",
  "status": "modified"
}
```

### DELETE /api/email-histories/{id}
Supprimer un email (soft delete)

### POST /api/email-histories/generate
Générer un email via IA (simulation)

**Requête:**
```json
{
  "notes": "Le client souhaite connaitre les tarifs des offres postales",
  "client_email": "client@example.com",
  "client_name": "Jane Smith"
}
```

**Réponse:** L'email généré en brouillon (status: draft)

### POST /api/email-histories/{id}/regenerate
Régénérer le contenu d'un email

**Réponse:** L'email avec status: modified

## Base de connaissances

### GET /api/knowledge-base
Lister les documents (paginé)

**Query Parameters:**
- `search`: recherche par titre/description
- `type`: procedure, offre, cgv, reglementation
- `tag`: filtrer par tag
- `per_page`: nombre d'éléments par page

### POST /api/knowledge-base
Créer un document (admin/manager only)

**Requête:**
```json
{
  "title": "Procédure de traitement",
  "description": "Description courte",
  "type": "procedure",
  "content": "Contenu détaillé...",
  "tags": ["procedure", "livraison"],
  "is_active": true
}
```

Types disponibles: `procedure`, `offre`, `cgv`, `reglementation`

### GET /api/knowledge-base/{id}
Récupérer un document

### PATCH /api/knowledge-base/{id}
Mettre à jour un document (admin/manager only)

### DELETE /api/knowledge-base/{id}
Supprimer un document (soft delete)

## Gestion des utilisateurs (Admin only)

### GET /api/users
Lister tous les utilisateurs

**Query Parameters:**
- `role`: conseiller, manager, admin
- `per_page`: nombre d'éléments par page

### POST /api/users
Créer un nouvel utilisateur

**Requête:**
```json
{
  "first_name": "Pierre",
  "last_name": "Martin",
  "email": "pierre@postsmartai.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "manager"
}
```

### GET /api/users/{id}
Récupérer les informations d'un utilisateur (l'utilisateur peut consulter son propre profil)

### PATCH /api/users/{id}
Mettre à jour un utilisateur (admin ou l'utilisateur lui-même)

**Requête:**
```json
{
  "first_name": "Pierre",
  "last_name": "Martin",
  "role": "admin"
}
```

### DELETE /api/users/{id}
Supprimer un utilisateur (admin only)

## Tableau de bord

### GET /api/dashboard/stats
Récupérer les statistiques (filtré par l'utilisateur sauf pour admin)

**Réponse:**
```json
{
  "success": true,
  "data": {
    "emails_today": 5,
    "emails_this_week": 25,
    "emails_this_month": 100,
    "total_emails": 250,
    "top_clients": [
      { "client_email": "top@client.com", "count": 15 },
      ...
    ],
    "status_stats": {
      "draft": 30,
      "sent": 200,
      "modified": 20
    }
  }
}
```

## Structure des réponses

### Réponse réussie (2xx)

```json
{
  "success": true,
  "message": "Description du succès",
  "data": { ... },
  "errors": null
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "data": null,
  "errors": { ... }
}
```

Codes HTTP :
- `200` : OK
- `201` : Créé
- `400` : Erreur de requête
- `401` : Non authentifié
- `403` : Accès interdit
- `404` : Non trouvé
- `422` : Erreur de validation

## Rôles et autorisations

### Rôles disponibles
- **conseiller** : Peut créer/voir/modifier ses propres emails et consulter la base de connaissances
- **manager** : Peut voir tous les emails, créer des documents de base de connaissances
- **admin** : Accès complet à tous les endpoints

### Middleware de rôle

```php
Route::middleware('role:admin')->group(function () {
    // Accessible uniquement par admin
});
```

## CORS

CORS est configuré pour accepter les requêtes depuis :
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Node dev server)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

Modifiez `config/cors.php` pour les URLs de production.

## Tests

Exécuter les tests :

```bash
php artisan test
```

Tests disponibles :
- `AuthTest` : Authentification, login, logout, register
- `EmailHistoryTest` : CRUD, génération, filtres
- `KnowledgeBaseTest` : CRUD, recherche, filtres par type
- `UserTest` : Gestion des utilisateurs (admin)
- `DashboardTest` : Statistiques

## Structure du projet

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── EmailHistoryController.php
│   │   ├── KnowledgeBaseController.php
│   │   ├── UserController.php
│   │   └── DashboardController.php
│   ├── Middleware/
│   │   └── RoleMiddleware.php
│   ├── Requests/
│   │   ├── LoginRequest.php
│   │   ├── StoreEmailHistoryRequest.php
│   │   └── ...
│   └── Resources/
│       └── ApiResponse.php
├── Models/
│   ├── User.php
│   ├── EmailHistory.php
│   └── KnowledgeBase.php
├── Policies/
│   └── EmailHistoryPolicy.php
database/
├── factories/
│   ├── UserFactory.php
│   ├── EmailHistoryFactory.php
│   └── KnowledgeBaseFactory.php
├── migrations/
│   └── ...
└── seeders/
    ├── UserSeeder.php
    ├── EmailHistorySeeder.php
    ├── KnowledgeBaseSeeder.php
    └── DatabaseSeeder.php
routes/
├── api.php
└── web.php
tests/
├── Feature/
│   ├── AuthTest.php
│   ├── EmailHistoryTest.php
│   ├── KnowledgeBaseTest.php
│   ├── UserTest.php
│   └── DashboardTest.php
```

## Démarrage rapide

1. **Installation**
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

2. **Configuration de la base de données**
   ```
   Modifiez les paramètres DB_* dans .env
   ```

3. **Migration et seeding**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

4. **Démarrage du serveur**
   ```bash
   php artisan serve
   ```

5. **Accès**
   - Base URL: `http://localhost:8000/api`
   - Admin credentials: `admin@postsmartai.com` / `password`

## Sécurité

- ✅ Validation des entrées (Form Requests)
- ✅ Authentication Sanctum
- ✅ Authorization policies
- ✅ Mass assignment protection (fillable/guarded)
- ✅ Password hashing
- ✅ CORS configuration
- ✅ Soft deletes pour historique

## Améliorations futures

- [ ] Intégration réelle avec OpenAI pour la génération d'emails
- [ ] WebSockets pour les notifications en temps réel
- [ ] Audit logging
- [ ] Rate limiting
- [ ] Caching avec Redis
- [ ] File upload pour les documents de la base de connaissances
- [ ] Export des emails en PDF
- [ ] Scheduling pour l'envoi automatique d'emails
- [ ] Analytics avancées
