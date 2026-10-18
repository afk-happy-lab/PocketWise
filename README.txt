POCKETWISE — STATIC WEB APP

This version is designed to run on GitHub Pages. It does not require Node.js,
npm, Expo, a server, or a database.

HOW TO PUBLISH
1. Download and extract this ZIP.
2. Open your GitHub repository: https://github.com/afk-happy-lab/PocketWise
3. Upload index.html, style.css, app.js, and this README.txt to the repository root.
   If GitHub asks whether to replace existing files, replace index.html if you want
   this static website to become the main page. Keep a backup of the old project first.
4. Commit the changes.
5. In the repository, open Settings > Pages.
6. Under Build and deployment, choose "Deploy from a branch".
7. Select branch "main" and folder "/ (root)", then Save.
8. Wait a minute or two. Your site should appear at:
   https://afk-happy-lab.github.io/PocketWise/

FEATURES
- Overview dashboard with balance, income, expenses and savings
- Add income and expense transactions
- Search and filter transactions; delete transactions
- Spending category chart and budget progress
- Edit monthly budgets
- Split a group expense equally and calculate per-person share
- Saves changes in this browser using localStorage

IMPORTANT LIMITATION
This is a working front-end demo. Data is stored only in the current browser on
the current device. There is no real user authentication, shared cloud database,
or cross-device syncing. Do not enter sensitive financial information.
