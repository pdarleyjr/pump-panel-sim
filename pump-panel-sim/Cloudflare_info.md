# Cloudflare Pages Configuration

## CRITICAL: CSP Hash Issue

The sha256 hash in the CSP header is being injected by **Cloudflare account-level settings**, NOT from the `public/_headers` file.

**Current deployed CSP (with hash):**

```text
script-src 'self' 'unsafe-eval' 'unsafe-inline' 'sha256-ZswfTY7H35rbv8WC7NXBoiC7WNu86vSzCDChNWwZZDM='
```

**Desired CSP (without hash, to allow inline scripts):**

```text
script-src 'self' 'unsafe-eval' 'unsafe-inline'
```

### How to Fix

1. **Log in to Cloudflare Dashboard**
2. **Navigate to:** Security → Content Security Policy (or check Transform Rules / Page Rules)
3. **Find the rule/setting that adds the sha256 hash**
4. **Remove or disable the hash** from the CSP directive
5. **Purge cache** and redeploy

Alternatively, check if a Cloudflare Worker is intercepting requests and adding headers.

---

## Headers Configuration

From `public/_headers`:

```text
/*
  # NOTE: Temporarily allowing 'unsafe-inline' to let devtools/injected inline scripts run during staging/debug.
  # Security: For production, prefer removing 'unsafe-inline' and using nonces or specific hashes for known inline scripts.
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' wss:; worker-src 'self' blob:; media-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: fullscreen=(), geolocation=()
```

/index.html
  Cache-Control: no-cache, must-revalidate

/manifest.webmanifest
  Cache-Control: no-cache, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable


  Deployment details
https://62016e5e.fire-pump-panel-simulator.pages.dev

Status:

    Success8:48AM October 17, 2025

Environment variables

Environment variables

Assets uploaded
Functions
Redirects
Headers
Assets uploaded

20 Files uploaded
File name
index.html
manifest.webmanifest
panel-background.png
vite.svg
assets
ChatGPT_Image_Oct_14_2025_05_32_49_PM.png
crosslay_analog_gauge.png
index-BedbvuWw.css
index-CQe6_CMa.js
index-CQe6_CMa.js.map
audio
README.md
controls
discharge-valve-closed.png
discharge-valve-half.png
knob.png
lever-off.png
lever-on.png
gauges
discharge-gauge.png
intake-gauge.png
rpm-gauge.png
icons
README.md
generate-icons.md