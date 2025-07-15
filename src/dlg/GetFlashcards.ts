import { Request } from "express";
import { ControllerConfig } from "../Config";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { FlashcardFactory } from "../cards/Card";
import { FlashCardsStore } from "../store/FlashCardsStore";


export class GetFlashcards implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const body = req.body
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // Extract user
        const topicId = req.query.topicId

        if (!topicId) throw new ValidationError(400, 'No Topic Id was provided');

        let client;

        try {

            // Instantiate the DB
            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Save the flashcard
            const cards = await new FlashCardsStore(db, execContext).getFlashcards(String(topicId));

            return { count: cards.length, flashcards: cards }


        } catch (error) {

            logger.compute(cid, `${error}`, "error")

            if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                throw error;
            }
            else {
                console.log(error);
                throw error;
            }

        }
        finally {
            if (client) client.close();
        }

    }

}