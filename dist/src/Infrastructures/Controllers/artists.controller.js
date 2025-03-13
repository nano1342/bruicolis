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
class ArtistController {
    getArtistsService;
    reqBodyFormatArtistPost = joi_1.default.object({
        name: joi_1.default.string().required(),
    });
    constructor(getArtistsService) {
        this.getArtistsService = getArtistsService;
    }
    async getArtists(req, res) {
        let result;
        console.log(req.body);
        if (req.body.page != null && req.body.limit != null) {
            result = await this.getArtistsService.getPage(req.body.page, req.body.limit);
        }
        else {
            result = await this.getArtistsService.getAll();
        }
        if (result == Errors.ErrorType.INCORRECT_PARAMETER) {
            res.status(400).send(Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER));
            return;
        }
        res.send(result);
    }
    async addArtist(req, res) {
        const { error, value } = this.reqBodyFormatArtistPost.validate(req.body);
        if (error) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.WRONG_BODY);
            res.status(400).send(errorBody);
            return;
        }
        const artistToInsert = {
            id: -1,
            name: req.body['name'],
            musicbrainzId: null,
        };
        console.log("pré envoi", req.body);
        const artist = await this.getArtistsService.addArtist(artistToInsert);
        res.send(artist);
    }
    async getArtist(req, res) {
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
        const artist = await this.getArtistsService.getOneById(id);
        if (artist == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.NOT_FOUND);
            res.status(404).send(errorBody);
            return;
        }
        res.send(artist);
    }
}
exports.default = ArtistController;
