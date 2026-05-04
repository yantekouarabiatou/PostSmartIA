# Setup Guide - PostSmartAI Backend

## Prérequis

- PHP 8.2+
- Laravel 11
- Composer
- MySQL 8.0+
- Node.js (optionnel, pour développement)

## Installation complète

### 1. Installer les dépendances Laravel

```bash
cd postaSmartAIbackend
composer install
```

### 2. Configuration d'environnement

Copiez le fichier d'exemple et générez une clé d'application :

```bash
cp .env.example .env
php artisan key:generate
```

### 3. Configurer la base de données

Ouvrez `.env` et configurez :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=postsmartai
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Créer la base de données

```bash
# Avec MySQL
mysql -u root -p -e "CREATE DATABASE postsmartai;"
```

### 5. Exécuter les migrations

```bash
php artisan migrate
```

Cela crée les tables :
- `users`
- `email_histories`
- `knowledge_base_items`
- `personal_access_tokens` (Sanctum)
- Et autres tables système

### 6. Remplir la base de données avec des données de test

```bash
php artisan db:seed
```

Cela crée :
- 1 administrateur (email: `admin@postsmartai.com`, password: `password`)
- 2 managers
- 10 conseillers
- ~5-15 emails par conseiller
- 10 documents de base de connaissances

### 7. Configurer CORS pour le frontend

Si votre frontend tourne sur une autre adresse, modifiez `config/cors.php` :

```php
'allowed_origins' => [
    'http://localhost:5173',     // Vite dev
    'http://localhost:3000',     // React dev
    'https://yourdomain.com',    // Production
],
```

### 8. Démarrer le serveur de développement

```bash
php artisan serve
```

Le serveur démarre sur `http://localhost:8000`

API disponible sur `http://localhost:8000/api`

---

## Vérifier l'installation

### Test simple : Login

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@postsmartai.com","password":"password"}'
```

Réponse attendue :
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "email": "admin@postsmartai.com", "role": "admin" },
    "token": "YOUR_TOKEN_HERE"
  }
}
```

### Lancer les tests

```bash
php artisan test
```

Tous les tests devraient être au vert ✅

---

## Commandes utiles

### Migrations

```bash
# Voir l'état des migrations
php artisan migrate:status

# Annuler les migrations
php artisan migrate:rollback

# Réinitialiser la base de données
php artisan migrate:refresh

# Réinitialiser + seed
php artisan migrate:refresh --seed
```

### Seeders

```bash
# Exécuter tous les seeders
php artisan db:seed

# Exécuter un seeder spécifique
php artisan db:seed --class=UserSeeder

# Réinitialiser et seed une seule table
php artisan db:seed --class=EmailHistorySeeder
```

### Cache

```bash
# Effacer le cache
php artisan cache:clear

# Effacer le cache des routes
php artisan route:clear

# Effacer tout le cache
php artisan optimize:clear
```

### Tinker (Shell interactif)

```bash
php artisan tinker
```

Exemples :
```php
# Créer un utilisateur
User::factory()->create(['email' => 'test@example.com'])

# Voir les utilisateurs
User::all()

# Supprimer tous les emails
EmailHistory::truncate()
```

---

## Structure des fichiers générés

```
app/
├── Http/
│   ├── Controllers/          # Contrôleurs API
│   ├── Middleware/          # Middlewares personnalisés
│   ├── Requests/            # Form Requests (validation)
│   └── Resources/           # Classes d'aide (ApiResponse)
├── Models/
│   ├── User.php             # Modèle utilisateur
│   ├── EmailHistory.php     # Historique des emails
│   └── KnowledgeBase.php    # Base de connaissances
├── Policies/                # Policies d'autorisation
└── Enums/                   # Énumérations (optionnel)

database/
├── factories/               # Factories (générateurs de données)
├── migrations/              # Migrations (schéma DB)
└── seeders/                 # Seeders (données initiales)

routes/
├── api.php                  # Routes API (nouvelles)
├── web.php                  # Routes web (existantes)
└── console.php              # Commandes Artisan

tests/
└── Feature/                 # Tests d'intégration

config/
├── cors.php                 # Configuration CORS (nouveau)
└── ...                      # Autres configurations

storage/
├── logs/                    # Fichiers de logs
└── app/                     # Stockage applicatif
```

---

## Dépannage

### Erreur : "Class 'App\Http\Middleware\RoleMiddleware' not found"

Solution : Vérifiez que le fichier existe à `app/Http/Middleware/RoleMiddleware.php`

### Erreur : "SQLSTATE[HY000]: General error: 1030 Got error"

Solution : La base de données doit être créée manuellement d'abord.

### Les migrations affichent une erreur

Solution : Vérifiez la connexion à la base de données dans `.env`

### Les seeders ne remplissent pas les données

Solution : Assurez-vous que les migrations ont d'abord réussi.

### Sanctum tokens non reconnus

Solution : Vérifiez que `config/cors.php` include l'URL de votre frontend dans `allowed_origins`

---

## Configuration supplémentaire

### Modifier le port du serveur

```bash
php artisan serve --port=8001
```

### Activez le logging des requêtes API

Modifiez `.env` :
```
LOG_CHANNEL=stack
LOG_LEVEL=debug
```

### Configurer le mail (optionnel)

Pour envoyer les emails réellement, modifiez `.env` :
```
MAIL_DRIVER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
```

---

## Prochaines étapes

1. ✅ Backend API opérationnel
2. ⏭️ Connecter le frontend React (utilisez les endpoints `/api`)
3. ⏭️ Intégrer OpenAI pour la génération d'emails réelle
4. ⏭️ Déployer sur un serveur de production
5. ⏭️ Configurer des pipelines CI/CD

Voir [API_DOCUMENTATION.md](API_DOCUMENTATION.md) pour une documentation complète des endpoints.
