# Copy This File to Your Server as `.env`

**Instructions:**
1. Open your local `server/.env` file (on your computer)
2. Copy the `n MONGODB_URI=...` line
3. In cPanel, create a file called `.env` in the `server` folder
4. Paste this content:

```
MONGODB_URI=[paste your MongoDB connection string here]
SUPABASE_URL=https://lujdzxjgydpxejnemjcj.supabase.co
PORT=5001
```

**Or the even lazier way:**
Just upload your local `server/.env` file from your computer to cPanel's `server` folder.

Then restart the app!
