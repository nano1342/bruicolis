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
exports.PgSongRepository = void 0;
const Errors = __importStar(require("../../Utils/Errors"));
const ResponseBody_1 = require("../../Utils/ResponseBody");
const util = __importStar(require("util"));
//TODO ajouter objet de lien SongArtistLink
class PgSongRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async selectAll(filters) {
        let songs;
        let sqlOptions = {
            where: {
                AND: []
            }
        };
        if (filters != null) {
            if ('tagsOR' in filters && filters['tagsOR'].length > 0) {
                const tags = filters['tagsOR'];
                sqlOptions.where.AND.push({
                    TagLink: {
                        some: {
                            idTag: { in: tags }
                        }
                    }
                });
            }
            if ('tagsAND' in filters && filters['tagsAND'].length > 0) {
                const tags = filters['tagsAND'];
                let obj = { AND: [] };
                for (let tag of tags) {
                    obj.AND.push({ TagLink: { some: { idTag: tag } } });
                }
                sqlOptions.where.AND.push(obj);
            }
            if ('text_query' in filters) {
                sqlOptions.where.AND.push({ name: { contains: filters['text_query'] } });
            }
        }
        songs = await this.prisma.song.findMany(sqlOptions);
        return songs.map((song) => {
            return {
                id: song.id,
                name: song.name,
                release_date: song.releaseDate
            };
        });
    }
    async selectPage(skip, take, filters) {
        let songs;
        const sqlOptions = {
            skip: skip,
            take: take
        };
        if (filters != null) {
            sqlOptions.where = { AND: [] };
            if ('tagsOR' in filters && filters['tagsOR'].length > 0) {
                const tags = filters['tagsOR'];
                sqlOptions.where.AND.push({
                    TagLink: {
                        some: {
                            idTag: { in: tags }
                        }
                    }
                });
            }
            if ('tagsAND' in filters && filters['tagsAND'].length > 0) {
                const tags = filters['tagsAND'];
                let obj = { AND: [] };
                for (let tag of tags) {
                    obj.AND.push({ TagLink: { some: { idTag: tag } } });
                }
                sqlOptions.where.AND.push(obj);
            }
            if ('text_query' in filters) {
                sqlOptions.where.AND.push({ name: { contains: filters['text_query'] } });
            }
            console.log(util.inspect(sqlOptions, { showHidden: false, depth: null, colors: true }));
            songs = await this.prisma.song.findMany(sqlOptions);
        }
        songs = await this.prisma.song.findMany(sqlOptions);
        return songs.map((song) => {
            return {
                id: song.id,
                name: song.name,
                release_date: song.releaseDate
            };
        });
    }
    async selectOneById(songId) {
        let song = await this.prisma.song.findUnique({ where: {
                id: songId,
            },
        });
        if (song == null) {
            return null;
        }
        ;
        return {
            id: song.id,
            name: song.name,
            release_date: song.releaseDate
        };
    }
    async insertSong(songToInsert, artistd) {
        let date;
        if (typeof songToInsert.release_date == 'string') {
            date = new Date(songToInsert.release_date);
        }
        else {
            date = songToInsert.release_date;
        }
        let newSong = await this.prisma.song.create({
            data: {
                name: songToInsert.name,
                releaseDate: date.toISOString()
            }
        });
        try {
            let newSongArtistLink = await this.prisma.songArtistLink.create({
                data: {
                    songId: newSong.id,
                    artistId: artistd
                }
            });
        }
        catch (PrismaClientKnownRequestError) {
            return Errors.ErrorType.FOREIGN_KEY_NOT_FOUND;
        }
        let newSongToReturn = {
            id: newSong.id,
            name: newSong.name,
            release_date: newSong.releaseDate
        };
        return newSongToReturn;
    }
    /**
     * Adds a tag to the song.
     * @param songId
     * @param tagId
     * @returns {ResponseBody}
     */
    async insertTag(songId, tagId) {
        try {
            let newTagLink = await this.prisma.tagLink.create({
                data: {
                    idTag: tagId,
                    idSong: songId,
                    idAlbum: undefined,
                    idArtist: undefined,
                }
            });
        }
        catch (error) {
            return ResponseBody_1.ResponseBody.getResponseBodyFail("Something went wrong. Tag not added.", Errors.getErrorBodyDefault(Errors.ErrorType.SERVER_ERROR));
        }
        return ResponseBody_1.ResponseBody.getResponseBodyOk("Tag successfully added to the song.");
    }
    async selectTags(songId) {
        let results = await this.prisma.tag.findMany({
            where: {
                TagLink: {
                    some: {
                        idSong: songId
                    },
                },
            },
        });
        const foundTags = results.map((tag) => {
            return {
                id: tag.id,
                label: tag.label,
            };
        });
        return ResponseBody_1.ResponseBody.getResponseBodyOkWithObject(foundTags.length + " tags found.", foundTags);
    }
}
exports.PgSongRepository = PgSongRepository;
