"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.songController = exports.getSongsService = exports.songRepository = exports.tagController = exports.tagService = exports.tagRepository = exports.albumController = exports.albumsService = exports.albumRepository = exports.artistController = exports.getArtistsService = exports.artistRepository = void 0;
const client_1 = require("@prisma/client");
const artists_controller_1 = __importDefault(require("./Infrastructures/Controllers/artists.controller"));
const pgArtistRepository_1 = require("./Infrastructures/Repositories/pgArtistRepository");
const getArtists_services_1 = require("./Services/getArtists.services");
const songs_controller_1 = __importDefault(require("./Infrastructures/Controllers/songs.controller"));
const pgSongRepository_1 = require("./Infrastructures/Repositories/pgSongRepository");
const getSongs_services_1 = require("./Services/getSongs.services");
const albums_controller_1 = __importDefault(require("./Infrastructures/Controllers/albums.controller"));
const pgAlbumRepository_1 = require("./Infrastructures/Repositories/pgAlbumRepository");
const albums_services_1 = require("./Services/albums.services");
const tags_controller_1 = __importDefault(require("./Infrastructures/Controllers/tags.controller"));
const pgTagRepository_1 = require("./Infrastructures/Repositories/pgTagRepository");
const tags_services_1 = require("./Services/tags.services");
const prisma = new client_1.PrismaClient();
// Artists
exports.artistRepository = new pgArtistRepository_1.PgArtistRepository(prisma);
exports.getArtistsService = new getArtists_services_1.GetArtistsService(exports.artistRepository);
exports.artistController = new artists_controller_1.default(exports.getArtistsService);
// Albums
exports.albumRepository = new pgAlbumRepository_1.PgAlbumRepository(prisma);
exports.albumsService = new albums_services_1.AlbumsService(exports.albumRepository);
exports.albumController = new albums_controller_1.default(exports.albumsService);
// Tags
exports.tagRepository = new pgTagRepository_1.PgTagRepository(prisma);
exports.tagService = new tags_services_1.TagsService(exports.tagRepository);
exports.tagController = new tags_controller_1.default(exports.tagService);
// Songs
exports.songRepository = new pgSongRepository_1.PgSongRepository(prisma);
exports.getSongsService = new getSongs_services_1.GetSongsService(exports.songRepository, exports.tagRepository);
exports.songController = new songs_controller_1.default(exports.getSongsService);
