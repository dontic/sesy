![Logo](./frontend/src/assets/logo.svg#gh-light-mode-only)
![Logo Dark Mode](./frontend/src/assets/logo_dark.svg#gh-dark-mode-only)

**Send and manage email campaigns easily with Sesy, an AWS SES wrapper.**

![Hero image](./docs/hero.png)

## Roadmap

- [x] Configure AWS SES fully from the app
- [x] Adding audience members via API
- [ ] [Poka-Yoke] Prevent sending campaigns if the SES configuration or domain are not set and valid
- [ ] Campaign statistics (SES Events webhook)
- [ ] Batch audience member edits

## Getting started

> ⚠️ You will need a production ready SES AWS account

1. Copy the `docker-compose.yml` in the root of this repo
2. Change the environment variables in the compose file to fit your domain
3. Run `docker compose up -d`
4. The app should be accessible at `localhost:3000`
5. Login with username `admin` and password `admin`, you will be able to change these in the app.

## Setting up your AWS SES account

TBD
