"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// "dev": "npm run build && npm run start",
const artists_1 = __importDefault(require("./src/Infrastructures/routes/artists"));
const songs_1 = __importDefault(require("./src/Infrastructures/routes/songs"));
const albums_1 = __importDefault(require("./src/Infrastructures/routes/albums"));
const tags_1 = __importDefault(require("./src/Infrastructures/routes/tags"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
// For parsing application/json
app.use(express_1.default.json());
// For parsing application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));
app.use("/artists", artists_1.default);
app.use("/songs", songs_1.default);
app.use("/albums", albums_1.default);
app.use("/tags", tags_1.default);
app.listen(port, () => {
    console.log(`Server is Fire at http://localhost:${port}`);
});
