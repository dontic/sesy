<p align="center">
  <img src="./frontend/src/assets/logo.svg#gh-light-mode-only" alt="Logo" width="300">
  <img src="./frontend/src/assets/logo_dark.svg#gh-dark-mode-only" alt="Logo Dark Mode" width="300">
</p>

<p align="center">
  <strong>Self-hosted email campaign management, powered by AWS SES.</strong>
</p>

> ⚠️ Sesy is still in beta and not yet recommended for production use.

![Hero image](./docs/hero.png)

---

## What is Sesy?

Sesy is an open-source, self-hosted email campaign platform built on top of AWS Simple Email Service (SES). It gives you a clean web interface to manage your entire email operation: From configuring AWS credentials and verifying domains, to building audiences and sending campaigns, with minimal AWS configuration.

### Why Sesy instead of the alternatives?

| | Sesy | Brevo | Mailchimp | Loops | Sendy |
|---|---|---|---|---|---|
| Self-hosted | ✅ | ❌ | ❌ | ❌ | ✅ |
| Open source | ✅ | ❌ | ❌ | ❌ | ❌ |
| Your data, your servers | ✅ | ❌ | ❌ | ❌ | ✅ |
| No per-email fees | ✅ | ❌ | ❌ | ❌ | ✅ |
| No monthly subscriber limits | ✅ | ❌ | ❌ | ❌ | ✅ |
| Modern UI | ✅ | ✅ | ✅ | ✅ | ❌ |
| REST API | ✅ | ✅ | ✅ | ✅ | ❌ |
| Docker one-command deploy | ✅ | ❌ | ❌ | ❌ | ❌ |

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

> ⚠️ You will need an AWS account with SES out of sandbox (production) mode.

1. Copy `docker-compose.yml` from this repo
2. Update the environment variables in the compose file to match your domain
3. Run `docker compose up -d`
4. Open `http://localhost:8080`
5. Log in with username `admin` / password `admin`, change these in the Settings page

---

## Setting Up AWS SES

### 1. Create an IAM User

1. Sign up for an AWS account [here](https://portal.aws.amazon.com/billing/signup)
2. In the AWS console, search for **IAM** and open it

   ![Search for IAM](./docs/search_iam.png)

3. In the left sidebar, click **Users**

   ![Click on users](./docs/users.png)

4. Click **Create user** in the top right

   ![Create user](./docs/create_user.png)

5. Give the user any name you like

   ![Name user](./docs/name_user.png)

6. On the permissions screen, select **Attach policies directly**

   ![Attach policies directly](./docs/attach_policies.png)

7. Search for and attach both `AmazonSESFullAccess` and `AmazonSNSFullAccess`, then click **Next**

   ![AmazonSESFullAccess](./docs/AmazonSESFullAccess.png)
   ![AmazonSNSFullAccess](./docs/AmazonSNSFullAccess.png)

8. Click **Create user**

### 2. Generate Access Keys

9. Click on the newly created user

   ![Created user](./docs/createduser.png)

10. Go to the **Security credentials** tab
11. Click **Create access key**

    ![Create access key](./docs/createaccesskey.png)

12. Copy the **Access Key** and **Secret Key**, then paste them into the AWS SES settings page in your Sesy instance. Select your preferred AWS region.

    ![Sesy SES settings](./docs/sesysessettings.png)

### 3. Request Production Access

13. New AWS accounts start in SES sandbox mode (you can only send to verified addresses). Submit a production access request through the AWS SES console.

    ![Request production](./docs/requestproduction.png)

14. AWS will email you when approved. This usually takes a few hours to a day. In the meantime, you can start importing your audience in the **Audience** tab.

---

## Roadmap

- [x] Configure AWS SES fully from the app
- [x] Adding audience members via API
- [x] Domain verification
- [ ] Onboarding flow on first deployment
- [ ] Prevent sending campaigns if SES configuration or domain are invalid
- [ ] Campaign statistics via SES event webhooks
- [ ] Batch audience member edits
