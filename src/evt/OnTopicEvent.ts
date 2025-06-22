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
import { OnTopicScraped } from "./handlers/OnTopicScraped";
import { OnTopicDeleted } from "./handlers/OnTopicDeleted";

/**
 * Reacts to events on topics
 */
export class OnTopicEvent implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        let msg = JSON.parse(String(Buffer.from(req.body.message.data, 'base64')))

        logger.compute(cid, `Received event ${JSON.stringify(msg)}`)

        if (msg.type == EVENTS.topicScraped) return new OnTopicScraped(execContext).do(req);
        else if (msg.type == EVENTS.topicDeleted) return new OnTopicDeleted(execContext).do(req);

        logger.compute(cid, `Event ${msg.type} is not handled by this service. Ignoring.`);

        return { consumed: false };

    }

}


export const EVENTS = {

    // A topic has been created
    topicCreated: "topicCreated",

    // A topic has been deleted
    topicDeleted: "topicDeleted",

    // A topic has been scraped
    topicScraped: "topicScraped",

}