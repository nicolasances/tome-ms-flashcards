import { Request } from "express";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { GENERATED_FLASHCARD_TYPES, SUPPORTED_FLASHCARD_TYPES } from "../model/FlashcardTypes";
import { FlashcardsGeneratorFactory } from "../cards/generators/FlashcardsGeneratorFactory";

/**
 * This endpoint returns a code mapped to the latest flashcards generation types
 */
export class GetLatestFlashcardsGeneration implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        return {latestGeneration: FlashcardsGeneratorFactory.getLatestGenerationCode()}

    }

}