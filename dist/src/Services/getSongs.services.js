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
const ResponseBody_1 = require("../Utils/ResponseBody");
//potentiellement renommer en service
class GetSongsService {
    songRepository;
    tagRepository;
    constructor(songRepository, tagRepository) {
        this.songRepository = songRepository;
        this.tagRepository = tagRepository;
    }
    getAll(filters) {
        return this.songRepository.selectAll(filters);
    }
    getPage(page, limit, filters) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_PARAMETER;
            }
            return this.songRepository.selectPage((page - 1) * limit, limit, filters);
        }
        catch (error) {
            return Errors.ErrorType.INCORRECT_PARAMETER;
        }
    }
    getOneById(songId) {
        //vérifications préalables avant requête
        return this.songRepository.selectOneById(songId);
    }
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
    async addTag(songId, tagId) {
        //checking if the tag ID is correct
        const tag = await this.tagRepository.selectOneById(tagId);
        if (tag == null) {
            return ResponseBody_1.ResponseBody.getResponseBodyFail("The provided tag ID doesn't exist.", Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_BODY_PARAMETER));
        }
        //checking if the song already has that tag
        const checkResp = await this.songRepository.selectTags(songId);
        if (checkResp.returnObject == null) {
            return ResponseBody_1.ResponseBody.getResponseBodyFailDefault();
        }
        else {
            const tags = checkResp.returnObject;
            const existingTag = tags.find(tag => tag.id === tagId);
            if (existingTag) {
                return ResponseBody_1.ResponseBody.getResponseBodyOk("Tag was already attributed to this song. Nothing was modified.");
            }
        }
        //adding the tag
        return this.songRepository.insertTag(songId, tagId);
    }
    async getTags(songId) {
        //vérifications préalables avant requête
        return this.songRepository.selectTags(songId);
    }
}
exports.GetSongsService = GetSongsService;
