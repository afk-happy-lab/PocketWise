POCKETWISE WEB APP — DEPLOY TO GITHUB PAGES

This is a static, browser-based web app built to publish on GitHub Pages. No Node.js or terminal is required.

UPLOAD:
1. Extract this ZIP.
2. In your PocketWise GitHub repository, choose Add file > Upload files.
3. Upload index.html, style.css, app.js, and README.txt to the repository root.
4. Commit changes.
5. In Settings > Pages, choose Deploy from a branch, branch main, folder /(root), Save.
6. Wait for the Pages deployment to finish, then open https://afk-happy-lab.github.io/PocketWise/

FEATURES:
- Browser-local sign up/sign in
- Overview and recent transaction dashboard
- Add income and expense transactions, delete transactions
- Spending chart and category breakdown
- Category budgets
- Create groups, record shared expenses, calculate equal per-person share
- Spending insights and CSV export
- Responsive layout for desktop and mobile

IMPORTANT LIMITATIONS:
- This is a client-side version. User accounts and money data are stored in localStorage in that browser only. It is not secure authentication, there is no cloud sync, and friends on different devices will not see each other's data.
- Do not enter real passwords or sensitive financial data. For real multi-user login and synced data, configure Supabase authentication and database policies and connect the app to that backend.
- Group split calculates equal shares; it does not send payments or automatically calculate final debts between people.
