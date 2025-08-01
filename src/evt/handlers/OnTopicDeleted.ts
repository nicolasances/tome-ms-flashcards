import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { FlashcardsGenerationOrchestrator } from "../../cards/FlashcardsGenerationOrchestrator";
import { Request } from "express";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { FlashCardsStore } from "../../store/FlashCardsStore";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

export class OnTopicDeleted {

    execContext: ExecutionContext;
    config: ControllerConfig;

    constructor(execContext: ExecutionContext) {
        this.execContext = execContext;
        this.config = execContext.config as ControllerConfig;
    }

    async do(req: Request) {

        let msg = JSON.parse(String(Buffer.from(req.body.message.data, 'base64')))
        
        const logger = this.execContext.logger;
        const cid = msg.cid;

        const topicId = msg.id;
        const user = msg.data.user;

        logger.compute(cid, `[OnTopicDeleted] Deleting all flashcards for topic ${topicId} and user ${user}.`)
        
        // Delete all flashcards for that topic and user
        let client;
        
        try {
            
            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());
            
            const deletedCount = await new FlashCardsStore(db, this.execContext).deleteAllFlashcards(topicId, user)
            
            logger.compute(cid, `[OnTopicDeleted] Deleted ${deletedCount} flashcards for topic ${topicId} and user ${user}.`)

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


        return { consumed: true }

    }
}