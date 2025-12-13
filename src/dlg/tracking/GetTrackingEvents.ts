import { Request } from "express";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { TrackingStore } from "../../store/TrackingStore";
import { ControllerConfig } from "../../Config";

/**
 * API to generate flashcards for a given content. 
 */
export class GetTrackingEvents implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        const topicId = req.params.topicId as string;

        if (!topicId) throw new ValidationError(400, 'No topic ID was provided to get tracking events.');

        let client;
        try {
            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            const events = await new TrackingStore(db, execContext).getTrackingEventsByTopicId(topicId);

            return { events }
        }
        catch (error) {
            logger.compute(cid, `${error}`, "error");
            throw new TotoRuntimeError(500, "Server error");
        }
        finally {
            client?.close();
        }
    }

}