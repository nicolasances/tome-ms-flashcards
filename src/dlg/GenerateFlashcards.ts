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
import { SectionTimelineFCGenerator } from "../cards/generators/SectionTimelineFCGenerator";
import { KnowledgeBase } from "../store/KnowledgeBase";

/**
 * API to generate flashcards for a given content. 
 */
export class GenerateFlashcards implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const body = req.body
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        let corpus = body.corpus
        const corpusCode = body.corpusCode;
        const topicCode = body.topicCode;

        const flashcardType = body.flashcardType || 'options';

        if (!corpus && !corpusCode) throw new ValidationError(400, 'No corpus text or corpus code was provided to generate flashcards on');
        if (!topicCode) throw new ValidationError(400, 'No topic code was provided to generate flashcards on');

        // If the corpus code is provided, fetch the corpus text from GCS
        
        if (corpusCode) {
            logger.compute(cid, `[GenerateFlashcards] Retrieving corpus for topic ${topicCode} with corpus code ${corpusCode} and type ${flashcardType}.`);
            corpus = await new KnowledgeBase().getSectionFile(topicCode, corpusCode);
            logger.compute(cid, `[GenerateFlashcards] Retrieved corpus for topic ${topicCode} with corpus code ${corpusCode} and type ${flashcardType}.`);
        }

        logger.compute(cid, `[GenerateFlashcards] Generating flashcards for topic ${topicCode} with type ${flashcardType}.`);

        if (flashcardType == 'options') return await new MultipleOptionsFCGenerator(execContext, req, userContext.email, body.topicCode, 'fakeid', corpusCode).generateFlashcards(corpus);
        else if (flashcardType == 'timeline') return await new SectionTimelineFCGenerator(execContext, req, userContext.email, body.topicCode, 'fakeid', corpusCode).generateFlashcards(corpus);

        logger.compute(cid, `[GenerateFlashcards] Generated flashcards for topic ${topicCode} with type ${flashcardType}.`);

    }

}