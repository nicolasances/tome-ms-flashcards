import { Request } from "express";
import { ControllerConfig } from "../Config";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { FlashcardFactory } from "../cards/Card";
import { FlashCardsStore } from "../store/FlashCardsStore";
import { MultipleOptionsFCGenerator } from "../cards/generators/MultipleOptionsFCGenerator";
import { exec } from "child_process";

/**
 * API to generate flashcards for a given content. 
 */
export class GenerateFlashcards implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const body = req.body
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // Extract user
        const corpus = body.corpus

        if (!corpus) throw new ValidationError(400, 'No corpus text was provided to generate flashcards on');

        const flashcards = await new MultipleOptionsFCGenerator(execContext, req, userContext.email, body.topicCode, body.topicId).generateFlashcards(corpus);

        return {
            flashcards: flashcards
        }

    }

}