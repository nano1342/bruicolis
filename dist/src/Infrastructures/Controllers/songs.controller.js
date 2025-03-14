"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Errors = __importStar(require("../../Utils/Errors"));
const joi_1 = __importDefault(require("joi"));
class SongController {
    getSongsService;
    reqBodyFormatSongPost = joi_1.default.object({
        name: joi_1.default.string().required(),
        release_date: joi_1.default.string().required(),
        artist_id: joi_1.default.number().required(),
    });
    constructor(getSongsService) {
        this.getSongsService = getSongsService;
    }
    async getSongs(req, res) {
        let result;
        console.log(req.body);
        if (req.body.page != null && req.body.limit != null) {
            result = await this.getSongsService.getPage(req.body.page, req.body.limit);
        }
        else {
            result = await this.getSongsService.getAll();
        }
        if (result == Errors.ErrorType.INCORRECT_PARAMETER) {
            res.status(400).send(Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER));
            return;
        }
        res.send(result);
    }
    async addSong(req, res) {
        const { error, value } = this.reqBodyFormatSongPost.validate(req.body);
        if (error) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.WRONG_BODY);
            res.status(400).send(errorBody);
            return;
        }
        const songToInsert = {
            id: -1,
            name: req.body['name'],
            release_date: req.body['release_date']
        };
        console.log("pré envoi", req.body);
        const insertedSong = await this.getSongsService.addSong(songToInsert, req.body['artist_id']);
        if (insertedSong == Errors.ErrorType.FOREIGN_KEY_NOT_FOUND) {
            res.status(400).send(Errors.getErrorBody(Errors.ErrorType.FOREIGN_KEY_NOT_FOUND, "The specified artist_id is unknown."));
        }
        else {
            res.send(insertedSong);
        }
    }
    async getSong(req, res) {
        if (req.params['id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }
        //parsing the parameter
        const id = Number.parseInt(req.params['id']);
        if (id == null || Number.isNaN(id)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }
        const song = await this.getSongsService.getOneById(id);
        if (song == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.NOT_FOUND);
            res.status(404).send(errorBody);
            return;
        }
        res.send(song);
    }
}
exports.default = SongController;
