import { Song, PrismaClient, SongArtistLink } from "@prisma/client";
import { Song as SongModel } from "../../Domains/Models/Song";
import { SongRepository } from "../../Domains/repositories/songRepository";
import * as Errors from "../../Utils/Errors";

//TODO ajouter objet de lien SongArtistLink
export class PgSongRepository implements SongRepository {
    
    constructor(private readonly prisma: PrismaClient) {
        
    }

    async selectAll() {
        let songs = await this.prisma.song.findMany();
        
        return songs.map((song) => {
            return {
                id: song.id,
                name: song.name,
                release_date: song.releaseDate
            }
        })
    }

    async selectPage(skip: number, take: number) {
        const options = {
            skip: skip,
            take: take
        }

        let songs = await this.prisma.song.findMany(options);

        return songs.map((song) => {
            return {
                id: song.id,
                name: song.name,
                release_date: song.releaseDate
            }
        })
    }

    async selectOneById(songId: number) {
        let song = await this.prisma.song.findUnique({where: {
            id: songId,
          },
        });
        
        if (song == null) {
            return null;
        };

        return {
            id: song.id,
            name: song.name,
            release_date: song.releaseDate
        }
    }

    async insertSong(songToInsert: SongModel, artistd: number) {
        let newSong: Song = await this.prisma.song.create({
            data: {
              name: songToInsert.name,
              releaseDate: new Date(songToInsert.release_date).toISOString()
            }
        });

        try {
            let newSongArtistLink: SongArtistLink = await this.prisma.songArtistLink.create({
                data: {
                    songId: newSong.id,
                    artistId: artistd
                }
            });
        } catch (PrismaClientKnownRequestError) {
            return Errors.ErrorType.FOREIGN_KEY_NOT_FOUND;
        }

        let newSongToReturn: SongModel = {
            id: newSong.id,
            name: newSong.name,
            release_date: newSong.releaseDate
        }

        return newSongToReturn;
    }
}