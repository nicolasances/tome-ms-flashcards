import { Request } from "express";
import { MultipleOptionsFC } from "./MultipleOptionsFC";

export interface Card {

    id?: string
    topicCode: string;
    user: string

    toBSON(): any;

}

export class FlashcardFactory {

    static newFlashcardFromRequest(type: 'options' | 'gap', request: Request, user: string): Card {

        if (type == 'options') return MultipleOptionsFC.fromRequest(request, user)

        throw new Error("Type not supported")

    }
}
