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
exports.AlbumsService = void 0;
const Errors = __importStar(require("../Utils/Errors"));
const ResponseBody_1 = require("../Utils/ResponseBody");
class AlbumsService {
    albumRepository;
    constructor(albumRepository) {
        this.albumRepository = albumRepository;
    }
    getAll() {
        return this.albumRepository.selectAll();
    }
    getPage(page, limit) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_BODY_PARAMETER;
            }
            return this.albumRepository.selectPage((page - 1) * limit, limit);
        }
        catch (error) {
            return Errors.ErrorType.INCORRECT_PARAMETER;
        }
    }
    getOneById(albumId) {
        //vérifications préalables avant requête
        return this.albumRepository.selectOneById(albumId);
    }
    getSongsAll(albumId) {
        //vérifications préalables avant requête
        return this.albumRepository.selectSongsAll(albumId);
    }
    async addSong(albumId, songId) {
        //vérifications préalables avant requête
        const albumSongs = await this.albumRepository.selectSongsAll(albumId);
        for (const song of albumSongs) {
            if (song.id == songId) {
                return ResponseBody_1.ResponseBody.getResponseBodyFail("Song already in album.", Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_BODY_PARAMETER));
            }
        }
        return this.albumRepository.insertSongLink(albumId, songId);
    }
    addAlbum(albumToInsert, artistId) {
        //vérifications préalables avant requête
        return this.albumRepository.insertAlbum(albumToInsert, artistId);
    }
    async addAlbumWithMultipleArtists(albumToInsert, artistIds) {
        if (artistIds.length < 1) {
            throw new Errors.IncorrectParameterError("at least one artist ID is required.");
        }
        let albums = [];
        for (const id of artistIds) {
            albums.push(await this.addAlbum(albumToInsert, id));
        }
        return albums;
    }
}
exports.AlbumsService = AlbumsService;
