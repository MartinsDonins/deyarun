# Security Policy

## 🔐 Reporting a Vulnerability

**We take security seriously.** If you discover a security vulnerability in DeyaRun, please help us protect our users by reporting it responsibly.

### How to Report

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, please report to:
- **Email**: security@deyarun.com
- **Subject**: `[SECURITY] Brief description`

### What to Include

Your report should contain:

1. **Description**: Clear explanation of the vulnerability
2. **Impact**: Potential security impact (data breach, unauthorized access, etc.)
3. **Steps to Reproduce**: Detailed steps to reproduce the issue
4. **Proof of Concept**: Code, screenshots, or logs (if applicable)
5. **Suggested Fix**: Your recommendation (if any)
6. **Your Contact**: Email for follow-up questions

### Example Report

```
Subject: [SECURITY] SQL Injection in workout endpoint

Description:
The /api/workouts endpoint is vulnerable to SQL injection via the
'sort' parameter.

Impact:
An attacker could read/modify database records or execute
arbitrary SQL commands.

Steps to Reproduce:
1. Send GET request to /api/workouts?sort=' OR 1=1--
2. Observe database error revealing table structure
3. Use UNION SELECT to extract user data

Proof of Concept:
curl "http://api.deyarun.com/api/workouts?sort=' OR 1=1--"

Suggested Fix:
Use parameterized queries or whitelist allowed sort fields.

Contact: researcher@example.com
```

---

## 🕐 Response Timeline

We aim to respond to security reports according to the following timeline:

| Stage | Timeline |
|-------|----------|
| **Initial Response** | Within 48 hours |
| **Vulnerability Confirmation** | Within 7 days |
| **Fix Development** | Depends on severity (see below) |
| **Public Disclosure** | 90 days after fix deployment |

### Severity-Based Response

| Severity | Response Time | Examples |
|----------|---------------|----------|
| **Critical** | Fix within 24-48 hours | Authentication bypass, data breach, RCE |
| **High** | Fix within 1 week | XSS, CSRF, privilege escalation |
| **Medium** | Fix within 2 weeks | Information disclosure, session issues |
| **Low** | Fix within 1 month | Rate limiting bypass, minor leaks |

---

## 🎯 Scope

### In Scope

The following are within the scope of our security program:

- **Backend API**: `https://api.deyarun.com`
- **Web Frontend**: `https://deyarun.com`
- **Mobile App**: DeyaRun Android app (Google Play)
- **Authentication**: Login, registration, OAuth flows
- **Data Security**: User data, workout data, integrations

### Out of Scope

The following are **NOT** part of this security program:

- **Social Engineering**: Phishing, pretexting
- **Physical Access**: Office access, hardware theft
- **Denial of Service**: DDoS, resource exhaustion
- **Third-Party Services**: Strava, Google Fit, Firebase (report to them directly)
- **Spam/Content Violations**: Report via abuse@deyarun.com
- **Issues in Dependencies**: Report to upstream maintainers

---

## 🛡️ Security Measures

### Current Security Implementations

We have implemented the following security measures:

#### Authentication & Authorization
- JWT tokens with httpOnly cookies (XSS protection)
- Bcrypt password hashing (12 rounds)
- Firebase Authentication integration
- OAuth2 for Google/Strava
- Session timeout after 7 days

#### API Security
- Helmet.js security headers (CSP, HSTS, X-Frame-Options)
- CORS with strict origin validation
- Rate limiting (100 requests / 15 minutes per IP)
- Input validation on all endpoints (express-validator)
- NoSQL injection protection (Mongoose parameterization)

#### Data Security
- MongoDB connection encryption (TLS)
- Encrypted credentials storage
- Sensitive data at rest encryption
- HTTPS/TLS 1.3 in production
- Regular security updates

#### Monitoring & Logging
- Sentry error tracking
- Failed login attempt monitoring
- Suspicious activity detection
- Audit logs for admin actions

---

## 🏆 Responsible Disclosure Policy

### Our Commitment

If you report a vulnerability responsibly:
- ✅ We will acknowledge your report within 48 hours
- ✅ We will keep you updated on fix progress
- ✅ We will credit you in our security advisories (if desired)
- ✅ We will not pursue legal action against you

### Your Commitment

To qualify for our responsible disclosure program, you must:
- ✅ Report vulnerabilities privately (not publicly)
- ✅ Give us reasonable time to fix (90 days)
- ✅ Not exploit the vulnerability beyond proof of concept
- ✅ Not access, modify, or delete user data
- ✅ Not perform actions that could harm availability

---

## 🚫 What NOT to Do

**DO NOT**:
- ❌ Test in production with real user data
- ❌ Perform DoS/DDoS attacks
- ❌ Access other users' data without permission
- ❌ Publicly disclose before we've had time to fix
- ❌ Demand payment (we don't have a bug bounty program)
- ❌ Perform automated vulnerability scanning without permission

**If in doubt, ask us first!**

---

## 🔍 Vulnerability Categories

### Critical Vulnerabilities

Report immediately if you find:
- Authentication bypass
- Remote code execution (RCE)
- SQL/NoSQL injection
- Data breach/exposure
- Privilege escalation to admin

### High Priority Vulnerabilities

- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Server-Side Request Forgery (SSRF)
- Insecure direct object references (IDOR)
- Broken access control

### Medium Priority Vulnerabilities

- Information disclosure
- Session management issues
- Missing security headers
- Weak password policy
- Insufficient rate limiting

### Low Priority Vulnerabilities

- Self-XSS
- Missing best practices
- Low-impact information leaks
- Version disclosure

---

## 🔒 Security Best Practices for Users

### For Developers

If you're contributing to DeyaRun:
- Never commit secrets (API keys, passwords, tokens)
- Use `.env` files for sensitive configuration
- Run `npm audit` before deploying
- Review dependency vulnerabilities
- Follow secure coding guidelines in [CONTRIBUTING.md](CONTRIBUTING.md)

### For Users

To protect your account:
- Use a strong, unique password (12+ characters)
- Enable Google OAuth for additional security
- Disconnect unused integrations (Strava, Google Fit)
- Report suspicious activity immediately
- Keep your email secure (we'll never ask for your password)

---

## 📋 Security Checklist for Contributors

Before submitting code:

- [ ] No hardcoded secrets or credentials
- [ ] All user inputs validated and sanitized
- [ ] Authentication/authorization checks in place
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection on all outputs
- [ ] CSRF tokens on state-changing operations
- [ ] Rate limiting on sensitive endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date (`npm audit`)
- [ ] Security tests pass

---

## 🔄 Security Updates

### How We Notify

Security updates are communicated via:
- **Security Advisories**: GitHub Security Advisories
- **Email**: Registered users (critical issues only)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md) (after fix deployed)

### Update Policy

- **Critical**: Emergency patch within 24-48 hours
- **High**: Patch in next scheduled release (weekly)
- **Medium**: Included in monthly release
- **Low**: Included in quarterly release

---

## 📞 Contact

### Security Team
- **Email**: security@deyarun.com
- **Response Time**: Within 48 hours

### General Support
- **Email**: support@deyarun.com
- **GitHub Issues**: For non-security bugs

---

## 🏅 Hall of Fame

We recognize and thank security researchers who help us improve:

| Researcher | Date | Vulnerability | Severity |
|------------|------|---------------|----------|
| *Your name could be here* | - | - | - |

*To be listed, you must report a valid vulnerability and choose to be publicly credited.*

---

## 📚 Resources

### Security Guidelines
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [GDPR Compliance](https://gdpr.eu/)

### Our Documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API endpoints
- [CONTRIBUTING.md](CONTRIBUTING.md) - Code standards

---

## 🔐 PGP Key (Optional)

For sensitive reports, you may encrypt your email using our PGP key:

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
(Add your PGP public key here if you want encrypted communications)
-----END PGP PUBLIC KEY BLOCK-----
```

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-01 | Initial security policy |

---

**Last Updated**: 2025-11-01
**Policy Owner**: DeyaRun Security Team
**Next Review**: 2026-02-01 (quarterly)
