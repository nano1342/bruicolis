import { ArtistRepository } from "../Domains/repositories/artistRepository";

export class GetArtistsUseCase {

    constructor(private readonly artistRepository:ArtistRepository) {
        
    }

    execute() {
        return this.artistRepository.getAll();
    }

    
}