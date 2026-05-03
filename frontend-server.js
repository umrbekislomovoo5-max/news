import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.FRONTEND_PORT || 3000;
const publicDir = path.join(__dirname, "public");

app.use(express.static(publicDir));

app.listen(port, () => {
  console.log(`frontend running on http://localhost:${port}`);
});
