import { Storage } from "@google-cloud/storage";
import { Logger } from "toto-api-controller/dist/logger/TotoLogger";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { LLMAPI } from "../api/LLMAPI";
import { Request } from "express";
import { log } from "console";
import { MultipleOptionsFC } from "./MultipleOptionsFC";
import { FlashCardsStore } from "../store/FlashCardsStore";
import { ControllerConfig } from "../Config";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";
import { TotoRuntimeError } from "toto-api-controller/dist/model/TotoRuntimeError";

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

    constructor(execContext: ExecutionContext, request: Request, user: string) {
        this.logger = execContext.logger;
        this.cid = execContext.cid;
        this.execContext = execContext;
        this.bucketName = `${process.env['GCP_PID']}-tome-bucket`
        this.authHeader = String(request.headers['authorization'] ?? request.headers['Authorization'])
        this.user = user;
        this.config = execContext.config as ControllerConfig;
    }

    async generateFlashcards(topicCode: string, topicId: string) {

        this.logger.compute(this.cid, `Generating Flashcards for topic ${topicCode}`)

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

            promises.push(async (): Promise<MultipleOptionsFC[]> => {

                this.logger.compute(this.cid, `Reading content of kb file ${file.name}`)

                // 2.1. Read the file content
                const [fileBuffer] = await file.download();
                const fileContent = fileBuffer.toString('utf-8');

                // 2.2. Create the flashcards with an LLM
                this.logger.compute(this.cid, `Prompting LLM to generate section's flashcards for file ${file.name}`)

                const prompt = `
                    The following are my notes on a book I wrote:\n
                    ----
                    ${fileContent}
                    ----
                    Make a series of questions for this text with different possible answers (only one right) to test my knowledge.
                    There must be questions on: 
                     - dates
                     - names (of people, locations, etc.)
                     - events (e.g. what happened in date xxx or what happened after this other thing happened?)
                    The output is an array of questions (field called 'questions') and each question to contain the following fields:
                    1. question: the question
                    2. options: the different possible answers, only one of which is true.
                    3. answer: the index in the array of options of the right answer
                    Make sure the answer is not always the same index.
                `

                const llmResponse = await new LLMAPI(this.execContext, this.authHeader).prompt(prompt, "json");

                this.logger.compute(this.cid, `LLM responded with flashcards for file ${file.name}`)

                // 2.3. For each generated flashcard in promisesResult, generate a MultipleOptionsFC 
                const generatedFlashcards: MultipleOptionsFC[] = llmResponse.value.questions.map(
                    (flashcard: { question: string; options: string[]; answer: number; }) => new MultipleOptionsFC(this.user, topicId, topicCode, flashcard.question, flashcard.options, flashcard.answer)
                );

                return generatedFlashcards;

            })
        }

        // 2.3. Wait for all the promises to finish 
        const promisesResult = await Promise.all(promises.map(fn => fn()));

        const generatedFlashcards = promisesResult.flat();

        this.logger.compute(this.cid, `Generated ${generatedFlashcards.length} flashcards for topic ${topicCode}`);

        // 3. Save all the generated flashcards
        let client;

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            const fcStore = new FlashCardsStore(db, this.execContext); 
            
            await fcStore.deleteAllFlashcards(topicCode, this.user)

            const insertedCount = await fcStore.saveFlashCards(generatedFlashcards);

            this.logger.compute(this.cid, `Persisted ${insertedCount} flashcards for topic ${topicCode}`);

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

        // 4. Return the generated flashcards
        return { flashcards: generatedFlashcards }
    }
}