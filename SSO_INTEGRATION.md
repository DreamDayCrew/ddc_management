# SSO Integration Option for DDC Management

## 🔐 Single Sign-On (SSO) Approach

If you prefer a more integrated experience where users log in once and access both your website and DDC Management:

### 1. JWT Token Based Authentication
```javascript
// Your website login
async function websiteLogin(email, password) {
    // Authenticate with DDC Management API
    const response = await fetch('your-ddc-management-url/api/auth/sso-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, source: 'website' })
    });
    
    const { token, user } = await response.json();
    
    // Store JWT token for future API calls
    localStorage.setItem('authToken', token);
    
    // Redirect to admin dashboard or DDC Management app
    if (user.role === 'admin') {
        window.location.href = 'your-ddc-management-url/admin-dashboard?token=' + token;
    }
}
```

### 2. Iframe Integration
Embed DDC Management app within your website:
```html
<iframe 
    src="http://ddc-management-prod.eba-y7bzpdrm.us-east-1.elasticbeanstalk.com?embedded=true&token=AUTH_TOKEN"
    width="100%" 
    height="800px"
    frameborder="0">
</iframe>
```

### 3. Subdomain Integration
- Your website: `https://yoursite.com`
- DDC Management: `https://admin.yoursite.com` (CNAME to EB URL)
- Shared authentication cookies across subdomains