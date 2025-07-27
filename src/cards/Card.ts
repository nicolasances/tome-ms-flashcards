import { Request } from "express";
import { MultipleOptionsFC } from "./model/MultipleOptionsFC";
import { SectionTimelineFC } from "./model/SectionTimelineFC";

export interface Card {

    id?: string
    topicCode: string;
    type: string;
    user: string;

    toBSON(): any;

}

export class FlashcardFactory {

    static newFlashcardFromRequest(type: 'options' | 'timeline', request: Request, user: string): Card {

        if (type == 'options') return MultipleOptionsFC.fromRequest(request, user);
        else if (type == 'timeline') return SectionTimelineFC.fromRequest(request, user);

        throw new Error(`Card with type ${type} are not supported`)

    }

    static newFlashcardFromBson(bson: any) {

        if (bson.type == 'options') return MultipleOptionsFC.fromBSON(bson);
        else if (bson.type == 'timeline') return SectionTimelineFC.fromBSON(bson);

        throw new Error(`Card with type ${bson.type} are not supported`)
    }
}
