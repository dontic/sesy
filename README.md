<p align="center">
  <img src="./frontend/src/assets/logo.svg#gh-light-mode-only" alt="Logo" width="300">
  <img src="./frontend/src/assets/logo_dark.svg#gh-dark-mode-only" alt="Logo Dark Mode" width="300">
</p>

<p align="center">
  <strong>Self-hosted email campaign management, powered by AWS SES.</strong>
</p>

> ⚠️ Sesy is still in beta and not yet recommended for production use.

> 👋 Beta testers are welcomed!

![Hero image](./docs/images/hero.png)

---

## What is Sesy?

Sesy is an open-source, self-hosted email campaign platform built on top of AWS Simple Email Service (SES). It gives you a clean web interface to manage your entire email operation: From configuring AWS credentials and verifying domains, to building audiences and sending campaigns, with minimal AWS configuration.

### Why Sesy instead of the alternatives?

|                              | Sesy | Brevo | Mailchimp | Loops | Sendy |
| ---------------------------- | ---- | ----- | --------- | ----- | ----- |
| Self-hosted                  | ✅   | ❌    | ❌        | ❌    | ✅    |
| Open source                  | ✅   | ❌    | ❌        | ❌    | ❌    |
| Your data, your servers      | ✅   | ❌    | ❌        | ❌    | ✅    |
| No per-email fees            | ✅   | ❌    | ❌        | ❌    | ✅    |
| No monthly subscriber limits | ✅   | ❌    | ❌        | ❌    | ✅    |
| Modern UI                    | ✅   | ✅    | ✅        | ✅    | ❌    |
| REST API                     | ✅   | ✅    | ✅        | ✅    | ❌    |
| Docker one-command deploy    | ✅   | ❌    | ❌        | ❌    | ❌    |

Other tools charge based on the number of contacts or emails sent, and you hand your audience data over to a third party.

Sesy is free, open-source, and deploys in minutes with Docker. Your data lives on your own infrastructure, and your only sending cost is AWS SES (**$1 per 10,000 emails**).

Compare that to Mailchimp at ~$350/month for 50,000 contacts, or Brevo at ~$65/month for 100,000 emails. A list of 50,000 subscribers receiving a weekly newsletter would cost around $20/month on AWS SES versus hundreds on a SaaS platform.

---

## Features

- **AWS SES management** - Configure credentials, region, and sending rates directly from the UI
- **Domain verification** - Guided DNS setup with real-time validation for TXT, DKIM, SPF, DMARC, and MAIL FROM records
- **Audience management** - Import contacts via CSV, organize with tags, track subscription status
- **Campaign editor** - HTML email editor with per-subscriber personalization (i.e. `first_name`) and automatic unsubscribe footers
- **Async sending** - Campaigns send in the background via Celery, respecting your SES rate limits
- **REST API** - Full API with OpenAPI/Swagger docs and API key authentication
- **One-command deploy** - Complete stack (app, worker, scheduler, DB, cache, proxy) via Docker Compose

---

## Getting Started

> ⚠️ You will need an AWS account with SES out of sandbox (production) mode. [Click here](./docs/configuring-aws-ses.md) for a quick guide on how to do it.

1. Copy `docker-compose.yml` from this repo
2. Update the environment variables in the compose file to match your domain
3. Run `docker compose up -d`
4. Open `http://localhost:8080`
5. Log in with username `admin` / password `admin`
6. The app will guide you trough all the steps.

---

## Roadmap

- [x] Configure AWS SES fully from the app
- [x] Adding audience members via API
- [x] Domain verification
- [x] Onboarding flow on first deployment
- [ ] SES configuration alerts (i.e. prevent sending campaigns if SES is not properly configured)
- [ ] Campaign statistics via SES event webhooks
- [ ] Batch audience member edits
- [ ] Transactional emails

---

## Collaborating

Contributions are welcome! Whether it's bug reports, feature requests, or pull requests, all input is appreciated.

- **Bug reports & feature requests** — Open an issue on GitHub describing the problem or idea
- **Pull requests** — Fork the repo, create a branch, make your changes, and open a PR against `main`.
- **Roadmap items** — If you want to work on something from the roadmap, open an issue first so we can coordinate

Please keep PRs focused — one feature or fix per PR makes review much easier.
