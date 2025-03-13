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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSongsService = void 0;
const Errors = __importStar(require("../Utils/Errors"));
//potentiellement renommer en service
class GetSongsService {
    songRepository;
    constructor(songRepository) {
        this.songRepository = songRepository;
    }
    getAll() {
        return this.songRepository.selectAll();
    }
    getPage(page, limit) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_PARAMETER;
            }
            return this.songRepository.selectPage((page - 1) * limit, limit);
        }
        catch (error) {
            return Errors.ErrorType.INCORRECT_PARAMETER;
        }
    }
    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getOneById(songId) {
        //vérifications préalables avant requête
        return this.songRepository.selectOneById(songId);
    }
    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    addSong(songToInsert, artistd) {
        //vérifications préalables avant requête
        return this.songRepository.insertSong(songToInsert, artistd);
    }
    async addSongWithMultipleArtists(songToInsert, artistIds) {
        if (artistIds.length < 1) {
            throw new Errors.IncorrectParameterError("at least one artist ID is required.");
        }
        let songs = [];
        for (const id of artistIds) {
            songs.push(await this.addSong(songToInsert, id));
        }
        return songs;
    }
}
exports.GetSongsService = GetSongsService;
