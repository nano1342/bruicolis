import { Tag, PrismaClient, TagLink } from "@prisma/client";
import { Tag as TagModel } from "../../Domains/Models/Tag";
import { TagRepository } from "../../Domains/repositories/tagRepository";
import * as Errors from "../../Utils/Errors";

export class PgTagRepository implements TagRepository {
    
    constructor(private readonly prisma: PrismaClient) {
        
    }

    async selectAll() {
        let tags = await this.prisma.tag.findMany();
        
        return tags.map((tag) => {
            return {
                id: tag.id,
                label: tag.label,
            }
        })
    }

    async selectPage(skip: number, take: number) {
        const options = {
            skip: skip,
            take: take
        }

        let tags = await this.prisma.tag.findMany(options);

        return tags.map((tag) => {
            return {
                id: tag.id,
                label: tag.label
            }
        })
    }

    async selectOneById(tagId: number) {
        let tag = await this.prisma.tag.findUnique({where: {
            id: tagId,
          },
        });
        
        if (tag == null) {
            return null;
        };

        return {
            id: tag.id,
            label: tag.label,
        }
    }

    async insertTag(tagToInsert: TagModel) {
        let newTag: Tag = await this.prisma.tag.create({
            data: {
              label: tagToInsert.label,
            }
        });

        let newTagToReturn: TagModel = {
            id: newTag.id,
            label: newTag.label,
        }

        return newTagToReturn;
    }
}