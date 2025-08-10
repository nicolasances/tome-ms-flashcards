import { Db } from "mongodb";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { collections, ControllerConfig } from "../Config";
import { Card, FlashcardFactory } from "../cards/Card";
import { FCGenerationLogEntry } from "../model/TrackingEvent";

export class TrackingStore {

    db: Db;
    dbName: string;

    constructor(db: Db, execContext: ExecutionContext) {
        this.db = db;
        this.dbName = (execContext.config as ControllerConfig).getDBName()
    }

    async trackEvent(event: FCGenerationLogEntry): Promise<string> {

        const result = await this.db.collection(collections.tracking).insertOne(event.toBSON());

        return result.insertedId.toHexString()
    }

    /**
     * Get tracking events by topic ID
     * @param topicId 
     * @returns 
     */
    async getTrackingEventsByTopicId(topicId: string): Promise<FCGenerationLogEntry[]> {

        const events = await this.db.collection(collections.tracking).find({ topicId }).toArray();

        return events.map(event => FCGenerationLogEntry.fromBSON(event));
    }
}

