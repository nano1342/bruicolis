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
exports.TagsService = void 0;
const Errors = __importStar(require("../Utils/Errors"));
class TagsService {
    tagRepository;
    constructor(tagRepository) {
        this.tagRepository = tagRepository;
    }
    getAll() {
        return this.tagRepository.selectAll();
    }
    getPage(page, limit) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_PARAMETER;
            }
            return this.tagRepository.selectPage((page - 1) * limit, limit);
        }
        catch (error) {
            return Errors.ErrorType.INCORRECT_PARAMETER;
        }
    }
    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getOneById(tagId) {
        //vérifications préalables avant requête
        return this.tagRepository.selectOneById(tagId);
    }
    getOneByMusicbrainzId(tagId) {
        //vérifications préalables avant requête
        return this.tagRepository.selectOneByMusicbrainzId(tagId);
    }
    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    addTag(tagToInsert) {
        //vérifications préalables avant requête
        return this.tagRepository.insertTag(tagToInsert);
    }
    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getTagSongs(tagId) {
        //vérifications préalables avant requête
        return this.tagRepository.selectTagSongs(tagId);
    }
    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getTagArtists(tagId) {
        //vérifications préalables avant requête
        return this.tagRepository.selectTagArtists(tagId);
    }
    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getTagAlbums(tagId) {
        //vérifications préalables avant requête
        return this.tagRepository.selectTagAlbums(tagId);
    }
}
exports.TagsService = TagsService;
