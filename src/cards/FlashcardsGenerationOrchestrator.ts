import { Storage } from "@google-cloud/storage";
import { Logger } from "toto-api-controller/dist/logger/TotoLogger";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { Request } from "express";
import { MultipleOptionsFC } from "./model/MultipleOptionsFC";
import { FlashCardsStore } from "../store/FlashCardsStore";
import { ControllerConfig } from "../Config";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { MultipleOptionsFCGenerator } from "./generators/MultipleOptionsFCGenerator";
import { EventPublisher, EVENTS } from "../evt/EventPublisher";
import { FlashcardsCreatedEvent } from "../evt/model/FlashcardsCreatedEvent";
import { DateFC } from "./model/DateFC";
import { DateFCGenerator } from "./generators/DateFCGenerator";
import { HistoricalGraphFC } from "./model/HistoricalGraphFC";
import { HistoricalGraphGenerator } from "./generators/HistoricalGraphGenerator";
import { FlashcardsGenerationRequestedEvent } from "../evt/model/FlashcardsGenerationRequestedEvent";
import { GENERATED_FLASHCARD_TYPES } from "../model/FlashcardTypes";
import { TrackingStore } from "../store/TrackingStore";
import { FCGenerationLogEntry } from "../model/TrackingEvent";
import { generateTrackingId } from "../util/TrackingId";

/**
 * This class is responsible for generating flashcards for a given topic 
 */
export class FlashcardsGenerationOrchestrator {

    logger: Logger;
    cid: string | undefined;
    bucketName: string;
    kbBaseFolder: string = "kb"
    execContext: ExecutionContext;
    authHeader: string;
    user: string;
    config: ControllerConfig;
    request: Request;

    constructor(execContext: ExecutionContext, cid: string, request: Request, user: string) {
        this.logger = execContext.logger;
        this.cid = cid;
        this.execContext = execContext;
        this.execContext.cid = cid; // Overwrite
        this.bucketName = `${process.env['GCP_PID']}-tome-bucket`
        this.authHeader = String(request.headers['authorization'] ?? request.headers['Authorization'])
        this.user = user;
        this.config = execContext.config as ControllerConfig;
        this.request = request;
    }

    /**
     * This method starts the process of generating flashcards for a given topic.
     * It's an ORCHESTRATOR. 
     * It retrieves the files from the GCS bucket and for each file and each type of flashcard to be generated, it sends an event on PubSub to generate flashcards for that section and flashcard type.
     */
    async startProcess(topicCode: string, topicId: string) {

        this.logger.compute(this.cid, `Starting the process to generate Flashcards for topic ${topicCode}`)

        let client;
        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            const trackingStore = new TrackingStore(db, this.execContext)

            // 0. Delete all tracking events
            const deleteedTrackingEvents = await trackingStore.deleteTrackingEvents(topicId);

            this.logger.compute(this.cid, `Deleted ${deleteedTrackingEvents} tracking events for topic ${topicCode}`);

            // 1. Delete all flashcards for the topic and user
            const deletedCount = await new FlashCardsStore(db, this.execContext).deleteAllFlashcards(topicId, this.user);

            this.logger.compute(this.cid, `Deleted ${deletedCount} flashcards for topic ${topicCode} and user ${this.user}`)

            // 1. Retrieve from GCS all the files related to the specified topic (topic code)
            // 1.1. Get the bucket
            const storage = new Storage();
            const bucket = storage.bucket(this.bucketName);

            // 1.2 Get all the files in the folder {kbBaseFolder}/{topicCode}
            const [files] = await bucket.getFiles({ prefix: `${this.kbBaseFolder}/${topicCode}/` });

            this.logger.compute(this.cid, `Found ${files.length} files in knowledge base for topic ${topicCode}`)

            // 2. For each file in the bucket read the content (text) and prompt an LLM to generate flashcards 
            // Run in parallel and wait for all requests to be done
            for (const file of files) {

                // 2.1 Extract the section code from the file name (the file name is expected to be in the format {sectionCode}.txt)
                const sectionCode = file.name.split('/').pop()?.replace('.txt', '');

                // 2.2 Send all pub sub messages for every flashcard type that needs to be generated
                const events = [];
                for (const flashcardType of GENERATED_FLASHCARD_TYPES) {
                    events.push(new FlashcardsGenerationRequestedEvent(topicCode, topicId, sectionCode!, this.user, flashcardType));
                }

                // 2.2.1. Event triggering
                for (const event of events) {

                    await new EventPublisher(this.execContext, "tomeflashcards").publishEvent(topicId, EVENTS.flashcardsGenerationRequested, `Requested generations of flashcards type [${event.flashcardsType}] for topic ${topicCode} - section ${sectionCode}`, event);

                    await trackingStore.trackEvent(new FCGenerationLogEntry(topicId, topicCode, sectionCode!, event.flashcardsType, "genRequestedEventSent", this.cid!, generateTrackingId()));
                    
                }

            }


        } catch (error) {

            this.logger.compute(this.cid, `${error}`, "error")

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