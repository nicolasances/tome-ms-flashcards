import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { FlashcardsGenerationOrchestrator } from "../../cards/FlashcardsGenerationOrchestrator";
import { Request } from "express";
import { FlashcardsGeneratorFactory } from "../../cards/generators/FlashcardsGeneratorFactory";
import { ControllerConfig } from "../../Config";
import { FlashCardsStore } from "../../store/FlashCardsStore";
import { EventPublisher, EVENTS } from "../EventPublisher";
import { FlashcardsCreatedEvent } from "../model/FlashcardsCreatedEvent";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";
import { Storage } from "@google-cloud/storage";

export class OnFlashcardsGenerationRequested {

    execContext: ExecutionContext;
    config: ControllerConfig;
    bucketName: string;
    kbBaseFolder: string = "kb"

    constructor(execContext: ExecutionContext) {
        this.execContext = execContext;
        this.config = execContext.config as ControllerConfig;
        this.bucketName = `${process.env['GCP_PID']}-tome-bucket`;
    }

    async do(req: Request) {

        let msg = JSON.parse(String(Buffer.from(req.body.message.data, 'base64')))

        const logger = this.execContext.logger;
        const cid = msg.cid;

        const topicCode = msg.data.topicCode;
        const topicId = msg.data.topicId;
        const sectionCode = msg.data.sectionCode;
        const flashcardsType = msg.data.flashcardsType;
        const user = msg.data.user;

        this.execContext.cid = cid;

        logger.compute(cid, `[OnFlashcardsGenerationRequested] Generating flashcards for topic ${topicCode} - ${sectionCode} of type ${flashcardsType}. User: ${user}`)

        // 1. Find the right generator 
        const generator = FlashcardsGeneratorFactory.getGenerator(this.execContext, req, msg.data.user, topicCode, topicId, sectionCode, flashcardsType)

        // 2. Read the corpus from GCS
        // 2.1. Get the bucket
        const storage = new Storage();
        const bucket = storage.bucket(this.bucketName);

        // 2.2 Get the specific file corresponding to this topic and section
        const fileName = `${this.kbBaseFolder}/${topicCode}/${sectionCode}.txt`;
        const file = bucket.file(fileName);

        // 2.3 Read the file content
        const [fileContent] = await file.download();
        const corpus = fileContent.toString('utf-8');

        logger.compute(cid, `Read corpus for topic ${topicCode} - ${sectionCode} from GCS`);

        // 3. Generate flashcards
        const flashcards = await generator.generateFlashcards(corpus);

        logger.compute(cid, `Generated ${flashcards.length} flashcards for topic ${topicCode} - ${sectionCode} - Flashcards type ${flashcardsType}`);

        if (!flashcards || flashcards.length === 0) return { consumed: true, message: "No flashcards generated" };

        // 4. Save the flashcards
        let client;
        try {

            // 3. Save all the generated flashcards
            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            const fcStore = new FlashCardsStore(db, this.execContext);

            const deletedCount = await fcStore.deleteAllSectionFlashcards(topicId, sectionCode, user, flashcardsType);

            logger.compute(cid, `Deleted ${deletedCount} flashcards for topic ${topicCode} - ${sectionCode} - Flashcards type ${flashcardsType} before saving new ones`)

            const insertedCount = await fcStore.saveFlashCards(flashcards);

            logger.compute(cid, `Persisted ${insertedCount} flashcards for topic ${topicCode} - ${sectionCode} - Flashcards type ${flashcardsType}`);

            // 5. Publish an event that flashcards have been generated for the topic
            await new EventPublisher(this.execContext, "tometopics").publishEvent(topicId, EVENTS.flashcardsCreated, `Flashcards generated for topic ${topicCode} - ${sectionCode} - Flashcards type ${flashcardsType}`, new FlashcardsCreatedEvent(
                generator.generation(),
                topicCode,
                topicId,
                sectionCode,
                flashcardsType,
                flashcards.length,
            ))

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