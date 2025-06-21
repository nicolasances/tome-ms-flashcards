import { Request } from "express";
import { ControllerConfig } from "../Config";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { FlashcardFactory } from "../cards/Card";
import { FlashCardsStore } from "../store/FlashCardsStore";
import { FlashcardsGenerator } from "../cards/FlashcardsGenerator";


export class OnTopicEvent implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        let msg = JSON.parse(String(Buffer.from(req.body.message.data, 'base64')))

        logger.compute(cid, `Received event ${JSON.stringify(msg)}`)

        // Only care about events: 
        // - topicContentSavedInKB
        if (msg.type != 'topicScraped') {
            logger.compute(cid, `Event not to be handled. Skipping`)
            return { consumed: false }
        }

        const topicCode = msg.id;
        const user = msg.data.user;

        // Generate flashcards for the event
        const result = await new FlashcardsGenerator(execContext, req, user).generateFlashcards(topicCode)

        if (result.flashcards && result.flashcards.length > 0) return { consumed: true }

        throw new TotoRuntimeError(500, `No flashcards generated for topic ${topicCode}`)

    }

}