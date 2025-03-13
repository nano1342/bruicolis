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
//TODO ajouter objet de lien SongArtistLink
class PgSongRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async selectAll() {
        let songs = await this.prisma.song.findMany();
        return songs.map((song) => {
            return {
                id: song.id,
                name: song.name,
                release_date: song.releaseDate
            };
        });
    }
    async selectPage(skip, take) {
        const options = {
            skip: skip,
            take: take
        };
        let songs = await this.prisma.song.findMany(options);
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
        let newSong = await this.prisma.song.create({
            data: {
                name: songToInsert.name,
                releaseDate: songToInsert.release_date.toISOString()
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
}
exports.PgSongRepository = PgSongRepository;
