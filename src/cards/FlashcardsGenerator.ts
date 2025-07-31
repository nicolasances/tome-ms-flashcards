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
import { SectionTimelineFCGenerator } from "./generators/SectionTimelineFCGenerator";
import { SectionTimelineFC } from "./model/SectionTimelineFC";
import { EventPublisher, EVENTS } from "../evt/EventPublisher";
import { FlashcardsCreatedEvent } from "../evt/model/FlashcardsCreatedEvent";
import { getFlashcardsGeneration } from "../util/FlashcardGeneration";
import { DateFC } from "./model/DateFC";
import { DateFCGenerator } from "./generators/DateFCGenerator";
import { HistoricalGraphFC } from "./model/HistoricalGraphFC";
import { HistoricalGraphGenerator } from "./generators/HistoricalGraphGenerator";

/**
 * This class is responsible for generating flashcards for a given topic 
 */
export class FlashcardsGenerator {

    logger: Logger;
    cid: string | undefined;
    bucketName: string;
    kbBaseFolder: string = "kb"
    execContext: ExecutionContext;
    authHeader: string;
    user: string;
    config: ControllerConfig;
    request: Request;

    constructor(execContext: ExecutionContext, request: Request, user: string) {
        this.logger = execContext.logger;
        this.cid = execContext.cid;
        this.execContext = execContext;
        this.bucketName = `${process.env['GCP_PID']}-tome-bucket`
        this.authHeader = String(request.headers['authorization'] ?? request.headers['Authorization'])
        this.user = user;
        this.config = execContext.config as ControllerConfig;
        this.request = request;
    }

    async generateFlashcards(topicCode: string, topicId: string) {

        this.logger.compute(this.cid, `Generating Flashcards for topic ${topicCode}`)

        let client;

        try {

            // 1. Retrieve from GCS all the files related to the specified topic (topic code)
            // 1.1. Get the bucket
            const storage = new Storage();
            const bucket = storage.bucket(this.bucketName);

            // 1.2 Get all the files in the folder {kbBaseFolder}/{topicCode}
            const [files] = await bucket.getFiles({ prefix: `${this.kbBaseFolder}/${topicCode}/` });

            this.logger.compute(this.cid, `Found ${files.length} files in knowledge base for topic ${topicCode}`)

            // 2. For each file in the bucket read the content (text) and prompt an LLM to generate flashcards 
            // Run in parallel and wait for all requests to be done
            let promises = [];
            for (const file of files) {

                // 2.1. Read the file content
                const [fileBuffer] = await file.download();
                const fileContent = fileBuffer.toString('utf-8');

                // Extract the section code from the file name (the file name is expected to be in the format {sectionCode}.txt)
                const sectionCode = file.name.split('/').pop()?.replace('.txt', '');

                // 2.1 Generate a historical graph flashcard for each file
                promises.push(async (): Promise<HistoricalGraphFC[]> => {

                    this.logger.compute(this.cid, `[Generating Historical Graph Flashcards] Generating historical graph flashcard for file ${file.name}`)

                    const historicalGraphFlashcards = await new HistoricalGraphGenerator(this.execContext, this.request, this.user, topicCode, topicId, sectionCode!).generateFlashcards(fileContent);

                    this.logger.compute(this.cid, `[Generating Historical Graph Flashcards] Generated historical graph flashcard for file ${file.name}`)

                    return historicalGraphFlashcards;
                })

                // 2.2 Generate multiple options flashcards for each file
                promises.push(async (): Promise<MultipleOptionsFC[]> => {

                    this.logger.compute(this.cid, `[Generating Multiple Options Flashcards] Reading content of kb file ${file.name}`)

                    // 2.2. Create the flashcards with an LLM
                    const generatedFlashcards = await new MultipleOptionsFCGenerator(this.execContext, this.request, this.user, topicCode, topicId, sectionCode!).generateFlashcards(fileContent);

                    this.logger.compute(this.cid, `[Generating Multiple Options Flashcards] LLM responded with ${generatedFlashcards.length} flashcards for file ${file.name}`)

                    return generatedFlashcards;

                })

                // 2.3 Generate date flashcards for each file
                promises.push(async (): Promise<DateFC[]> => {

                    this.logger.compute(this.cid, `[Generating Date Flashcards] Reading content of kb file ${file.name}`)

                    // 2.2. Create the flashcards with an LLM
                    const generatedFlashcards = await new DateFCGenerator(this.execContext, this.request, this.user, topicCode, topicId, sectionCode!).generateFlashcards(fileContent);

                    this.logger.compute(this.cid, `[Generating Date Flashcards] LLM responded with ${generatedFlashcards.length} flashcards for file ${file.name}`)

                    return generatedFlashcards;

                })
            }

            // 2.3. Wait for all the promises to finish 
            const promisesResult = await Promise.all(promises.map(fn => fn()));

            const generatedFlashcards = promisesResult.flat();

            this.logger.compute(this.cid, `Generated ${generatedFlashcards.length} flashcards for topic ${topicCode}`);

            // 3. Save all the generated flashcards
            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            const fcStore = new FlashCardsStore(db, this.execContext);

            const deletedCount = await fcStore.deleteAllFlashcards(topicId, this.user)

            this.logger.compute(this.cid, `Deleted ${deletedCount} flashcards for topic ${topicCode} before saving new ones`)

            const insertedCount = await fcStore.saveFlashCards(generatedFlashcards);

            this.logger.compute(this.cid, `Persisted ${insertedCount} flashcards for topic ${topicCode}`);

            // 5. Publish an event that flashcards have been generated for the topic
            await new EventPublisher(this.execContext, "tometopics").publishEvent(topicId, EVENTS.flashcardsCreated, `Flashcards generated for topic ${topicCode}`, new FlashcardsCreatedEvent(
                getFlashcardsGeneration(),
                topicCode,
                topicId,
                generatedFlashcards.length,
            ))

            // 5. Return the generated flashcards
            return { flashcards: generatedFlashcards }

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