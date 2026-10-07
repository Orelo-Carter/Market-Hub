# Deploy Markethub on Render

The Render Blueprint runs the Express API and built React frontend as one web service. React routes use an index.html fallback, and frontend API requests use the same origin.

1. Upload this project to a GitHub repository. Keep `.env` files and `node_modules` out of the repository; the root `.gitignore` excludes them.
2. In Render, select **New > Blueprint**, connect the repository, and select its `render.yaml`.
3. Set `MONGO_URI` to a hosted MongoDB connection string. Checkout uses MongoDB transactions, so use a replica set such as MongoDB Atlas. Allow connections from Render's outbound IP addresses in your database network settings.
4. Deploy. Open the service's assigned HTTPS URL after the build and `/health` check succeed.

Render generates `ACCESS_TOKEN_SECRET`. The payment callback and manager invitation links automatically use `RENDER_EXTERNAL_URL`. For a custom domain, set `FRONTEND_URL` to that domain's HTTPS URL.

## Optional features

Configure `PAYSTACK_SECRET_KEY` to enable checkout. Set the Paystack webhook URL to `https://YOUR-SERVICE.onrender.com/api/webhooks/paystack`. Use test credentials for a portfolio demo.

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` for manager invitation emails.

To create the first administrator, set `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, and `SUPER_ADMIN_PASSWORD`, then run `npm run seed:admin` using a trusted environment connected to the hosted database. Remove the seeding password from the service afterward.

For demo inventory, run `npm run seed:categories` and `npm run seed:demo` against the intended demo database. Review seed scripts before running them against existing data.

## Checks

- Open `/health` and confirm a successful JSON response.
- Open `/`, `/signin`, and a product route directly to check React routing.
- Confirm signup/signin and product browsing use the hosted API.
- Verify checkout with Paystack test payments if configured.

Render documentation: https://render.com/docs/deploy-node-express-app and https://render.com/docs/blueprint-spec.
