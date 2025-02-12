import express, { Express, Request, Response , Application } from 'express';
// "dev": "npm run build && npm run start",

import artistsRoutes from "./routes/artists";
import musicRoutes from "./routes/songs";

const app: Application = express();
const port = process.env.PORT || 8000;

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));

app.use("/artists", artistsRoutes);
app.use("/songs", musicRoutes);

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});