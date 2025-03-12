import express, { Express, Request, Response , Application } from 'express';
// "dev": "npm run build && npm run start",

import artistsRoutes from "./src/Infrastructures/routes/artists";
import musicRoutes from "./src/Infrastructures/routes/songs";
import albumRoutes from "./src/Infrastructures/routes/albums";

const app: Application = express();
const port = process.env.PORT || 8000;

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));

app.use("/artists", artistsRoutes);
app.use("/songs", musicRoutes);
app.use("/albums", albumRoutes);

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});