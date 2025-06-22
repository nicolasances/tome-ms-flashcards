import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { FlashcardsGenerator } from "../../cards/FlashcardsGenerator";
import { Request } from "express";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";

export class OnTopicScraped {

    execContext: ExecutionContext;

    constructor(execContext: ExecutionContext) {
        this.execContext = execContext;
    }

    async do(req: Request) {

        let msg = JSON.parse(String(Buffer.from(req.body.message.data, 'base64')))

        const logger = this.execContext.logger;
        const cid = msg.cid;

        const topicCode = msg.id;
        const topicId = msg.data.topicId;
        const user = msg.data.user;

        logger.compute(cid, `[OnTopicScraped] Generating flashcards for topic ${topicCode} and user ${user}.`)

        // Generate flashcards for the event
        const result = await new FlashcardsGenerator(this.execContext, req, user).generateFlashcards(topicCode, topicId)

        if (!result.flashcards || result.flashcards.length == 0) throw new TotoRuntimeError(500, `No flashcards generated for topic ${topicCode}`);

        return { consumed: true }

    }
}