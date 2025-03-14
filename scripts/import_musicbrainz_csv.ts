import Database from "better-sqlite3";
import {
    getArtistsService,
    getSongsService,
    albumsService,
    tagService
} from "../src/dependencies";
import { ErrorType } from "../src/Utils/Errors";

// import artists csv from file
import { parse } from "csv-parse";
import { ReadStream } from "fs";

import { performance, PerformanceObserver } from "perf_hooks";
import { AsyncLocalStorage } from "async_hooks";
import { TagsService } from "../src/Services/tags.services";
/**
 * needs to be reset for each async operation
 */
let asyncLocalStorage: AsyncLocalStorage<{
    i: number;
}> = new AsyncLocalStorage();

interface PerfFrame {
    start: number;
    end: number;
}
function perfNow(): PerfFrame {
    return { start: performance.now(), end: 0 };
}
function perfEnd(t: PerfFrame | undefined, name: string) {
    if (t === undefined) {
        console.error(
            "perfEnd: t is undefined",
            "i=" + asyncLocalStorage.getStore()?.i
        );
        return;
    }
    t.end = performance.now();
    console.log(name, "i=" + asyncLocalStorage.getStore()?.i, t.end - t.start);
}

const fs = require("fs");
const path = require("path");
let db: Database.Database;

// __dirname is in dist !!!
const root = path.resolve(__dirname, "..", "..", "musicbrainz_csv");
const artistsCsv = path.resolve(root, "out_artist.csv");
const songsCsv = path.resolve(root, "out_recording.csv");
const artistCreditNameCsv = path.resolve(root, "out_artist_credit_name.csv");
const trackCsv = path.resolve(root, "out_track.csv");
const mediumCsv = path.resolve(root, "out_medium.csv");
const releaseCsv = path.resolve(root, "out_release.csv");
const releaseCountryCsv = path.resolve(root, "out_release_country.csv");
const tagsCsv = path.resolve(root, "out_tag.csv");
const artistTagCsv = path.resolve(root, "out_artist_tag.csv");
const releaseTagCsv = path.resolve(root, "out_release_tag.csv");
const recordingTagCsv = path.resolve(root, "out_recording_tag.csv");

interface ReleaseDate {
    year: number;
    month: number;
    day: number;
}

const MAX_ARTISTS = 50_000;
const MAX_SONGS = 5_000;
const MAX_MAPPINGS = 500_000;
const MAX_ALBUMS = 5_000;
const MAX_TAGS = 5_000;
const MAX_TAG_ARTIST_BINDINGS = 20_000;
const MAX_TAG_RELEASE_BINDINGS = 20_000;
const MAX_TAG_RECORDING_BINDINGS = 20_000;
const MEASURE_PERFORMANCE = false;

/**
 * Based on https://musicbrainz.org/statistics on 2025-03-14
 */
const TOTAL = {
    ARTISTS: 2_566_990,
    /**
     * recordings
     */
    SONGS: 34_724_402,
    /**
     * releases
     */
    ALBUMS: 4_642_010,
    TAGS: 220_810,


    TRACK_MAPPINGS: 49_351_430,
    MEDIUM_MAPPINGS: 5_137_294,
    RELEASE_MAPPINGS: 4_642_010,
    RELEASE_DATE_MAPPINGS: 12_836_534,

    TAG_ARTIST_BINDINGS: 609_703,
    TAG_RELEASE_BINDINGS: 3_014_212,
    TAG_RECORDING_BINDINGS: 6_424_541,
}

function percent(ratio: number) {
    return Math.round(ratio /*to percent*/ * 100 /*round 2 digits*/ * 100) / 100;
}
function logMax(max: number, total: number, name: string) {
    console.info(`exploring at most ${max} ${name} entries of ${total} potential entries (${percent(max/total)}%)`)
}

logMax(MAX_ARTISTS, TOTAL.ARTISTS, "artist");
logMax(MAX_ALBUMS, TOTAL.ALBUMS, "album");
logMax(MAX_SONGS, TOTAL.SONGS, "song");
logMax(MAX_TAGS, TOTAL.TAGS, "tag");
logMax(MAX_MAPPINGS, TOTAL.TRACK_MAPPINGS, "track mapping");
logMax(MAX_MAPPINGS, TOTAL.MEDIUM_MAPPINGS, "medium mapping");
logMax(MAX_MAPPINGS, TOTAL.RELEASE_MAPPINGS, "release mapping");
logMax(MAX_MAPPINGS, TOTAL.RELEASE_DATE_MAPPINGS, "release date mapping");
logMax(MAX_TAG_ARTIST_BINDINGS, TOTAL.TAG_ARTIST_BINDINGS, "tag artist binding")

function read(
    path: unknown,
    callbacks: {
        ondata: (r: string[], s: ReadStream) => void;
        onendorclose: () => void;
    }
) {
    const stream: ReadStream = fs.createReadStream(path);
    let endOrCloseSent = false; // both events are not mutually exclusive
    const sendEndOrClose = () => {
        if (!endOrCloseSent) {
            callbacks.onendorclose();
            endOrCloseSent = true;
        }
    };
    stream
        .on("close", sendEndOrClose)
        .pipe(parse({ delimiter: "," }))
        .on("data", (r: string[]) => callbacks.ondata(r, stream))
        .on("end", sendEndOrClose);
}

function start() {
    // remove existing database if any
    if (fs.existsSync("musicbrainzMapping.db")) {
        fs.unlinkSync("musicbrainzMapping.db");
    }
    db = new Database("musicbrainzMapping.db");
    db.pragma("journal_mode = WAL");

    // not enough memory in nodeJS with Maps, using sqlite instead

    // setup maps
    db.exec(
        "CREATE TABLE artist_credit_to_artist (artist_credit INTEGER, artist INTEGER)"
    );
    db.exec(
        "CREATE TABLE recording_to_medium (recording INTEGER, medium INTEGER)"
    );
    db.exec("CREATE TABLE medium_to_release (medium INTEGER, release INTEGER)");
    db.exec(
        "CREATE TABLE release_to_release_date (release INTEGER, date DATETIME)"
    );
    db.exec(
        "CREATE TABLE artist_musicbrainz_to_db_id (musicbrainz_id INTEGER, id INTEGER)"
    );
    db.exec(
        "CREATE TABLE tag_musicbrainz_to_db_id (musicbrainz_id INTEGER, id INTEGER)"
    );
    db.exec(
        "CREATE TABLE album_musicbrainz_to_db_id (musicbrainz_id INTEGER, id INTEGER)"
    );
    db.exec(
        "CREATE TABLE song_musicbrainz_to_db_id (musicbrainz_id INTEGER, id INTEGER)"
    );

    importArtists();
}

/**
 * @satisfies timerify friendly
 */
let getTruncatedName = (name: string, maxLength: number) => {
    let n = name;
    if (n.length > maxLength) {
        n = n.substring(0, maxLength);
        console.warn(`truncated name: ${name}\n\t-->${n}`);
    }
    return n;
};

let expectedArtists = 0;
let acknowledgedArtists = 0;
let artistPerfTimings = new Map<string, PerfFrame>();
function importArtists() {
    console.log("=== importing artists...");
    asyncLocalStorage = new AsyncLocalStorage();
    let i = 0;
    read(artistsCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 10000 === 0 && i <= MAX_ARTISTS) {
                console.log(i);
            }
            if (i > MAX_ARTISTS) {
                stream.destroy();
                return;
            }

            let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
            const musicbrainzId = parseInt(r[0]);
            try {
                expectedArtists++;
                asyncLocalStorage.run({ i }, () => {
                    if (MEASURE_PERFORMANCE) {
                        artistPerfTimings.set(name, perfNow());
                    }
                    getArtistsService
                        .addArtist({
                            id: 0, // ignored by service,
                            name,
                            musicbrainzId,
                        })
                        .then((artist) => {
                            if (artist !== null) {
                                db.prepare(
                                    "INSERT INTO artist_musicbrainz_to_db_id VALUES (?, ?)"
                                ).run(musicbrainzId, artist.id);
                            }
                            acknowledgedArtists++;
                            if (MEASURE_PERFORMANCE) {
                                perfEnd(
                                    artistPerfTimings.get(name),
                                    "addArtist"
                                );
                                artistPerfTimings.delete(name);
                            }
                        });
                });
            } catch (e) {
                expectedArtists--;
                console.error("failed to import artist", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged artists: ${acknowledgedArtists}/${expectedArtists}`
                );
                if (acknowledgedArtists === expectedArtists) {
                    clearInterval(interval);
                    console.log("artists imports prepared.");
                    buildArtistCreditMappings();
                }
            }, 1000);
        },
    });
}

function buildArtistCreditMappings() {
    console.log("=== building artist credit mappings...");
    let i = 0;
    read(artistCreditNameCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }

            // artist credit name : link between [artist credit (array), position] and artist.
            // so we can directly map one artist credti to n artists

            const artistCredit = parseInt(r[0]);
            const artist = parseInt(r[2]);
            db.prepare("INSERT INTO artist_credit_to_artist VALUES (?, ?)").run(
                artistCredit,
                artist
            );
        },
        onendorclose: () => {
            console.log("artist credit mappings done.");
            buildTrackMappings();
        },
    });
}

function buildTrackMappings() {
    console.log("=== building track mappings...");
    let i = 0;
    read(trackCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }

            const recording = parseInt(r[2]);
            const medium = parseInt(r[3]);
            db.prepare("INSERT INTO recording_to_medium VALUES (?, ?)").run(
                recording,
                medium
            );
        },
        onendorclose: () => {
            console.log("recording to medium mappings done.");
            buildMediumToReleaseMappings();
        },
    });
}

function buildMediumToReleaseMappings() {
    console.log("=== building medium to release mappings...");
    let i = 0;
    read(mediumCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }

            const medium = parseInt(r[0]);
            const release = parseInt(r[1]);
            db.prepare("INSERT INTO medium_to_release VALUES (?, ?)").run(
                medium,
                release
            );
        },
        onendorclose: () => {
            console.log("medium to release mappings done.");
            buildReleaseToReleaseCountryMappings();
        },
    });
}

function buildReleaseToReleaseCountryMappings() {
    console.log("=== building release to release date mappings...");
    let i = 0;
    read(releaseCountryCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }

            const release = parseInt(r[0]);
            const releaseDate = {
                year: parseInt(r[2]),
                month: parseInt(r[3]),
                day: parseInt(r[4]),
            };
            db.prepare(
                "INSERT INTO release_to_release_date VALUES (?, ?)"
            ).run(
                release,
                convertToDate(releaseDate).toISOString()
            );
        },
        onendorclose: () => {
            console.log("release to release date mappings done.");
            importSongs();
        },
    });
}

let expectedSongs = 0;
let acknowledgedSongs = 0;
let songPerfTimings = new Map<string, PerfFrame>();
function importSongs() {
    console.log("=== importing songs...");
    asyncLocalStorage = new AsyncLocalStorage();
    let i = 0;
    read(songsCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 1000 === 0 && i <= MAX_SONGS) {
                console.log(i);
            }
            if (i > MAX_SONGS) {
                stream.destroy();
                return;
            }

            let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
            const artistCredit = parseInt(r[3]);
            const artistIds = mapArtistCreditToArtists(artistCredit);
            if (!artistIds || artistIds.length === 0) {
                // console.warn(
                //     `Cannot import song "${name} because it doesn't have any bound artist in the database."`
                // );
                // TODO uncomment this line
                return;
            }

            // map musicbrainz id to db id
            let dbArtistIds: number[] = artistIdsToDbIds(artistIds);
            if (dbArtistIds.length === 0) {
                // console.warn(
                //     `Cannot import song "${name} because it doesn't have any bound artist (with corresponding musicbrainz id) in the database."`
                // );
                // TODO uncomment this line
                return;
            }
            const recordingId = parseInt(r[0]);
            const date = getRecordingFirstReleaseDate(recordingId);

            try {
                expectedSongs++;
                asyncLocalStorage.run({ i }, () => {
                    if (MEASURE_PERFORMANCE) {
                        songPerfTimings.set(name, perfNow());
                        console.log(
                            "adding song",
                            name,
                            "with artists",
                            dbArtistIds
                        );
                    }
                    getSongsService
                        .addSongWithMultipleArtists(
                            {
                                id: 0, // ignored by service,
                                name,
                                release_date: date === null ? new Date(0) : date,
                            },
                            dbArtistIds
                        )
                        .then((song) => {
                            song.forEach((s) => {
                                if (s !== null && !(typeof s === "string")) {
                                    db.prepare(
                                        "INSERT INTO song_musicbrainz_to_db_id VALUES (?, ?)"
                                    ).run(recordingId, s.id);
                                }
                            })
                            acknowledgedSongs++;
                            if (MEASURE_PERFORMANCE) {
                                perfEnd(songPerfTimings.get(name), "addSong");
                                songPerfTimings.delete(name);
                            }
                        });
                });
            } catch (e) {
                console.error("failed to import song", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged songs: ${acknowledgedSongs}/${expectedSongs}`
                );
                if (acknowledgedSongs === expectedSongs) {
                    clearInterval(interval);
                    console.log("songs imported.");
                    importAlbums();
                }
            }, 1000);
        },
    });
}

const getRecordingFirstReleaseDateCache = new Map<number, Date | null>();
const getReleaseFirstReleaseDateCache = new Map<number, Date | null>();
/**
 * @satisfies timerify friendly
 */
let getRecordingFirstReleaseDate = (
    recordingId: number
): Date | null => {
    if (getRecordingFirstReleaseDateCache.has(recordingId)) {
        return getRecordingFirstReleaseDateCache.get(recordingId)!;
    }
    const stmt = db.prepare(
        "SELECT MIN(date) FROM recording_to_medium NATURAL JOIN medium_to_release NATURAL JOIN release_to_release_date WHERE recording = ?"
    );

    let date: Date | null = null;
    const result = stmt.get(recordingId) as { "MIN(date)": string } | undefined;
    if (result === undefined) {
        date = null;
    } else {
        date = new Date(result["MIN(date)"]);
    }
        
    getRecordingFirstReleaseDateCache.set(recordingId, date);
    return date;
};

/**
 * @satisfies timerify friendly
 */
let getReleaseFirstReleaseDate = (releaseId: number): Date | null => {
    if (getReleaseFirstReleaseDateCache.has(releaseId)) {
        return getReleaseFirstReleaseDateCache.get(releaseId)!;
    }
    const stmt = db.prepare(
        "SELECT MIN(date) FROM release_to_release_date WHERE release = ?"
    );

    let date: Date | null = null;
    const result = stmt.get(releaseId) as { "MIN(date)": string } | undefined;
    if (result === undefined) {
        date = null;
    } else {
        date = new Date(result["MIN(date)"]);
    }
    getReleaseFirstReleaseDateCache.set(releaseId, date);
    return date;
};

function findArtistIdByMusicBrainzId(id: number): { id: number } | undefined {
    return db
        .prepare(
            "SELECT id FROM artist_musicbrainz_to_db_id WHERE musicbrainz_id = ?"
        )
        .get(id) as { id: number } | undefined;
}
function findSongIdByMusicBrainzId(id: number): { id: number } | undefined {
    return db
        .prepare(
            "SELECT id FROM song_musicbrainz_to_db_id WHERE musicbrainz_id = ?"
        )
        .get(id) as { id: number } | undefined;
}
function findAlbumIdByMusicBrainzId(id: number): { id: number } | undefined {
    return db
        .prepare(
            "SELECT id FROM album_musicbrainz_to_db_id WHERE musicbrainz_id = ?"
        )
        .get(id) as { id: number } | undefined;
}
function findTagIdByMusicBrainzId(id: number): { id: number } | undefined {
    return db
        .prepare(
            "SELECT id FROM tag_musicbrainz_to_db_id WHERE musicbrainz_id = ?"
        )
        .get(id) as { id: number } | undefined;
}

function mapArtistCreditToArtists(artistCredit: number): number[] {
    return db
        .prepare(
            "SELECT artist FROM artist_credit_to_artist WHERE artist_credit = ?"
        )
        .all(artistCredit)
        .map((v) => (v as { artist: number }).artist);
}

let expectedAlbums = 0;
let acknowledgedAlbums = 0;
let albumPerfTimings = new Map<string, PerfFrame>();
/**
 * @see https://musicbrainz.org/doc/Medium
 */
function importAlbums() {
    console.log("=== importing albums...");
    asyncLocalStorage = new AsyncLocalStorage();
    let i = 0;

    read(releaseCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 1000 === 0 && i <= MAX_ALBUMS) {
                console.log(i);
            }
            if (i > MAX_ALBUMS) {
                stream.destroy();
                return;
            }

            let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
            const artistCredit = parseInt(r[3]);
            const artistIds = mapArtistCreditToArtists(artistCredit);
            if (!artistIds || artistIds.length === 0) {
                // console.warn(
                //     `Cannot import album "${name} because it doesn't have any bound artist in the database."`
                // );
                // TODO uncomment this line
                return;
            }

            // map musicbrainz id to db id
            let dbArtistIds: number[] = artistIdsToDbIds(artistIds);
            if (dbArtistIds.length === 0) {
                // console.warn(
                //     `Cannot import album "${name} because it doesn't have any bound artist (with corresponding musicbrainz id) in the database."`
                // );
                // TODO uncomment this line
                return;
            }
            const releaseId = parseInt(r[0]);
            const date = getReleaseFirstReleaseDate(releaseId);

            try {
                expectedAlbums++;
                asyncLocalStorage.run({ i }, () => {
                    if (MEASURE_PERFORMANCE) {
                        albumPerfTimings.set(name, perfNow());
                    }
                    albumsService
                        .addAlbumWithMultipleArtists(
                            {
                                id: 0, // ignored by service,
                                name,
                                release_date: date === null ? new Date(0) : date,
                            },
                            dbArtistIds
                        )
                        .then((album) => {
                            album.forEach((a) => {
                                if (a !== null && !(typeof a === "string")) {
                                    db.prepare(
                                        "INSERT INTO album_musicbrainz_to_db_id VALUES (?, ?)"
                                    ).run(releaseId, a.id);
                                }
                            })
                            acknowledgedAlbums++;
                            if (MEASURE_PERFORMANCE) {
                                perfEnd(albumPerfTimings.get(name), "addAlbum");
                                albumPerfTimings.delete(name);
                            }
                        });
                });
            } catch (e) {
                console.error("failed to import album", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged albums: ${acknowledgedAlbums}/${expectedAlbums}`
                );
                if (acknowledgedAlbums === expectedAlbums) {
                    clearInterval(interval);
                    console.log("albums imported.");
                    importTags();
                }
            }, 1000);
        },
    });
}

/**
 * @satisfies timerify friendly
 */
let convertToDate = (releaseDate: ReleaseDate | null): Date => {
    const date = new Date();
    if (releaseDate !== null && !isNaN(releaseDate.year) && !isNaN(releaseDate.month) && !isNaN(releaseDate.day)) {
        date.setUTCFullYear(Math.max(1970, releaseDate.year));
        date.setUTCMonth(releaseDate.month);
        date.setUTCDate(releaseDate.day);
    }
    return date;
};

const artistIdsToDbIdsCache = new Map<number, number | undefined>();
/**
 * @satisfies timerify friendly
 */
let artistIdsToDbIds = (artistIds: number[]): number[] => {
    let dbArtistIds: number[] = [];
    for (const id of artistIds) {
        let dbArtistId: number | undefined;
        if (artistIdsToDbIdsCache.has(id)) {
            dbArtistId = artistIdsToDbIdsCache.get(id)!;
            continue;
        } else {
            dbArtistId = findArtistIdByMusicBrainzId(id)?.id;
            artistIdsToDbIdsCache.set(id, dbArtistId);
        }
        if (dbArtistId !== undefined) {
            dbArtistIds.push(dbArtistId);
        }
    }
    return dbArtistIds;
};

let expectedTags = 0;
let acknowledgedTags = 0;
let tagPerfTimings = new Map<string, PerfFrame>();
function importTags() {
    console.log("=== importing tags...");
    asyncLocalStorage = new AsyncLocalStorage();
    let i = 0;

    read(tagsCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 5000 === 0 && i <= MAX_TAGS) {
                console.log(i);
            }
            if (i > MAX_TAGS) {
                stream.destroy();
                return;
            }

            let name = getTruncatedName(r[1], 50); // name is the 3rd field in the csv
            const tagId = parseInt(r[0]);

            try {
                expectedTags++;
                asyncLocalStorage.run({ i }, () => {
                    if (MEASURE_PERFORMANCE) {
                        tagPerfTimings.set(name, perfNow());
                    }
                    tagService.addTag
                        (
                            {
                                id: 0, // ignored by service,
                                label: name,
                                musicbrainzId: tagId,
                            },
                        )
                        .then((tag) => {
                            if (tag !== null && !(typeof tag === "string")) {
                                db.prepare(
                                    "INSERT INTO tag_musicbrainz_to_db_id VALUES (?, ?)"
                                ).run(tagId, tag.id);
                            }
                            acknowledgedTags++;
                            const perf = tagPerfTimings.get(name);
                            if (MEASURE_PERFORMANCE) {
                                perfEnd(tagPerfTimings.get(name), "addTag");
                                tagPerfTimings.delete(name);
                            }
                        });
                });
            } catch (e) {
                console.error("failed to import tag", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged tags: ${acknowledgedTags}/${expectedTags}`
                );
                if (acknowledgedTags === expectedTags) {
                    clearInterval(interval);
                    console.log("tags imported.");
                    bindArtistsAndTags();
                }
            }, 1000);
        },
    });
}

let expectedArtistTags = 0;
let acknowledgedArtistTags = 0;
function bindArtistsAndTags() {
    console.log("=== binding artists and tags...");
    asyncLocalStorage = new AsyncLocalStorage();
    let i = 0;

    read(artistTagCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 5000 === 0 && i <= MAX_TAG_ARTIST_BINDINGS) {
                console.log(i);
            }
            if (i > MAX_TAG_ARTIST_BINDINGS) {
                stream.destroy();
                return;
            }

            const artistId = parseInt(r[0]);
            const tagId = parseInt(r[1]);
            const dbArtistId = findArtistIdByMusicBrainzId(artistId)?.id;
            const dbTagId = findTagIdByMusicBrainzId(tagId)?.id;
            if (dbArtistId === undefined || dbTagId === undefined ) {
                return;
            }

            try {
                expectedArtistTags++;
                asyncLocalStorage.run({ i }, () => {
                    getArtistsService.addTag(dbArtistId, dbTagId)
                        .then(() => {
                            acknowledgedArtistTags++;
                        });
                });
            } catch (e) {
                console.error("failed to import artist tag", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged artist tags: ${acknowledgedArtistTags}/${expectedArtistTags}`
                );
                if (acknowledgedArtistTags === expectedArtistTags) {
                    clearInterval(interval);
                    console.log("artist tags imported.");
                    bindAlbumsAndTags();
                }
            }, 1000);
        },
    });

}

let expectedAlbumTags = 0;
let acknowledgedAlbumTags = 0;
function bindAlbumsAndTags() {
    console.log("=== binding albums and tags...");
    asyncLocalStorage = new AsyncLocalStorage();
    let i = 0;

    read(artistTagCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 5000 === 0 && i <= MAX_TAG_RELEASE_BINDINGS) {
                console.log(i);
            }
            if (i > MAX_TAG_RELEASE_BINDINGS) {
                stream.destroy();
                return;
            }

            const releaseId = parseInt(r[0]);
            const tagId = parseInt(r[1]);
            const dbReleaseId = findAlbumIdByMusicBrainzId(releaseId)?.id;
            const dbTagId = findTagIdByMusicBrainzId(tagId)?.id;
            if (dbReleaseId === undefined || dbTagId === undefined ) {
                return;
            }

            try {
                expectedAlbumTags++;
                asyncLocalStorage.run({ i }, () => {
                    albumsService.addTag(dbReleaseId, dbTagId)
                        .then(() => {
                            acknowledgedAlbumTags++;
                        });
                });
            } catch (e) {
                console.error("failed to import album tag", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged album tags: ${acknowledgedAlbumTags}/${expectedAlbumTags}`
                );
                if (acknowledgedAlbumTags === expectedAlbumTags) {
                    clearInterval(interval);
                    console.log("album tags imported.");
                    bindSongsAndTags();
                }
            }, 1000);
        },
    });

}

let expectedSongTags = 0;
let acknowledgedSongTags = 0;
function bindSongsAndTags() {
    console.log("=== binding songs and tags...");
    asyncLocalStorage = new AsyncLocalStorage();
    let i = 0;

    read(recordingTagCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 5000 === 0 && i <= MAX_TAG_RECORDING_BINDINGS) {
                console.log(i);
            }
            if (i > MAX_TAG_RECORDING_BINDINGS) {
                stream.destroy();
                return;
            }

            const recordingId = parseInt(r[0]);
            const tagId = parseInt(r[1]);
            const dbSongId = findSongIdByMusicBrainzId(recordingId)?.id;
            const dbTagId = findTagIdByMusicBrainzId(tagId)?.id;
            if (dbSongId === undefined || dbTagId === undefined ) {
                return;
            }

            try {
                expectedSongTags++;
                asyncLocalStorage.run({ i }, () => {
                    getSongsService.addTag(dbSongId, dbTagId)
                        .then(() => {
                            acknowledgedSongTags++;
                        });
                });
            } catch (e) {
                console.error("failed to import song tag", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged song tags: ${acknowledgedSongTags}/${expectedSongTags}`
                );
                if (acknowledgedSongTags === expectedSongTags) {
                    clearInterval(interval);
                    console.log("song tags imported.");
                    finish();
                }
            }, 1000);
        },
    });

}

function finish() {
    disconnectPerfIfAny();
    db.close();
    console.log("=== done ===");
}

// https://nodejs.org/api/perf_hooks.html#measuring-the-duration-of-async-operations
let disconnectPerfIfAny = () => {};

if (MEASURE_PERFORMANCE) {
    // artistIdsToDbIds = performance.timerify(artistIdsToDbIds);
    getRecordingFirstReleaseDate = performance.timerify(
        getRecordingFirstReleaseDate
    );
    getReleaseFirstReleaseDate = performance.timerify(
        getReleaseFirstReleaseDate
    );
    // convertToDate = performance.timerify(convertToDate);
    performance.mark("start");

    // Activate the observer
    const obs: PerformanceObserver = new PerformanceObserver(
        (list: PerformanceObserverEntryList) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                console.log(`${entry.name}()`, entry.duration);
            });
            performance.clearMarks();
            performance.clearMeasures();
        }
    );
    obs.observe({ entryTypes: ["function", "measure"] });
}

start();
