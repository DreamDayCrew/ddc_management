# API Integration Guide for DDC Management

## 🎯 Overview
Your DDC Management application can serve as a backend API for your website's admin login system.

## 🔧 Implementation Steps

### 1. Configure CORS for Your Website
Add CORS configuration to allow your website to make API calls to your DDC Management app.

### 2. Create Authentication Endpoints
Your DDC Management app will handle:
- Admin login authentication  
- Session management
- Protected admin routes
- User authorization

### 3. API Endpoints Structure
```
POST /api/auth/login          - Admin login
POST /api/auth/logout         - Admin logout  
GET  /api/auth/profile        - Get admin profile
GET  /api/auth/verify         - Verify session token

GET  /api/events             - Get all events
POST /api/events             - Create new event
PUT  /api/events/:id         - Update event
DELETE /api/events/:id       - Delete event

GET  /api/assets             - Get all assets
POST /api/assets             - Create new asset
... (all other DDC Management features)
```

## 🌐 Website Integration Examples

### JavaScript/Frontend Integration:
```javascript
// Login function on your website
async function adminLogin(email, password) {
    const response = await fetch('http://ddc-management-prod.eba-y7bzpdrm.us-east-1.elasticbeanstalk.com/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for sessions
        body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
        const data = await response.json();
        // Store session token or redirect to admin dashboard
        return data;
    } else {
        throw new Error('Login failed');
    }
}

// Get events data for admin dashboard
async function getEvents() {
    const response = await fetch('http://ddc-management-prod.eba-y7bzpdrm.us-east-1.elasticbeanstalk.com/api/events', {
        credentials: 'include'
    });
    return response.json();
}
```

### PHP Integration Example:
```php
// Login function
function adminLogin($email, $password) {
    $url = 'http://ddc-management-prod.eba-y7bzpdrm.us-east-1.elasticbeanstalk.com/api/auth/login';
    
    $data = json_encode([
        'email' => $email,
        'password' => $password
    ]);
    
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => 'POST',
            'content' => $data
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    return json_decode($result, true);
}
```

## 🔒 Security Configuration

### 1. Environment Variables to Set:
```bash
CORS_ORIGIN=https://your-website.com
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password
```

### 2. SSL/HTTPS Setup:
- Enable HTTPS on your Elastic Beanstalk environment
- Use SSL certificates for secure communication
- Set secure cookie options

## 🚀 Benefits of This Architecture:

✅ **Separation of Concerns** - Website handles UI, DDC Management handles business logic  
✅ **Scalability** - Can serve multiple websites/applications  
✅ **Security** - Centralized authentication and data management  
✅ **Flexibility** - Easy to add new features or integrate with other systems  
✅ **Performance** - Dedicated backend for heavy operations  

## 📱 Mobile App Ready:
This setup also allows you to easily create mobile apps that use the same API endpoints.

## 🔄 Next Steps:
1. Configure CORS in your DDC Management app
2. Set up authentication endpoints
3. Test API integration from your website
4. Deploy with proper SSL certificates