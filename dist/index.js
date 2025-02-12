"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Import routes
const artists_js_1 = __importDefault(require("./routes/artists.js"));
const music_js_1 = __importDefault(require("./routes/music.js"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.get('/', (req, res) => {
    const o = express_1.default.response;
    var jesuis = { musiiiiic: 'Chris Prolls' };
    console.log("jesuis ", jesuis);
    res.send(jesuis);
});
app.use("/artists", artists_js_1.default);
app.use("/music", music_js_1.default);
app.listen(port, () => {
    console.log(`Server is Fire at http://localhost:${port}`);
});
