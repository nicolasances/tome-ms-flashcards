import { Request } from "express";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { GENERATED_FLASHCARD_TYPES, SUPPORTED_FLASHCARD_TYPES } from "../model/FlashcardTypes";

/**
 * This endpoint returns the type of flashcards that are currently used for generating flashcards (independently of the topic).
 * Examples of flashcard types include: "graph", "date", etc.. 
 */
export class GetFlashcardTypes implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        return { supported: SUPPORTED_FLASHCARD_TYPES, generated: GENERATED_FLASHCARD_TYPES };

    }

}