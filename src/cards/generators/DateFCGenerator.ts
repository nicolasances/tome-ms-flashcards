import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { LLMAPI } from "../../api/LLMAPI";
import { DateFC } from "../model/DateFC";
import { Request } from "express";

export class DateFCGenerator {

    execContext: ExecutionContext;
    authHeader: string;
    user: string;
    topicCode: string;
    sectionCode: string;
    topicId: string;

    constructor(execContext: ExecutionContext, request: Request, user: string, topicCode: string, topicId: string, sectionCode: string) {
        this.execContext = execContext;
        this.authHeader = String(request.headers['authorization'] ?? request.headers['Authorization']);
        this.user = user;
        this.topicCode = topicCode;
        this.sectionCode = sectionCode;
        this.topicId = topicId;
    }

    static generation() {return "d1"}

    async generateFlashcards(corpus: string): Promise<DateFC[]> {

        const prompt = `
            You are an assistant that creates quiz cards from a historical or non-fictional text, to help the user learn the dates of all events in the text.

            **Your task:**
            From the given text, extract all events with a date events and for each one generate a question on the date.

            **Instructions:**
            - IMPORTANT: if the text does not contain any dates, **return an empty array**. 
            - Do not invent facts not supported by the text.
            - If a date does not have a year, ignore it and do not generate a question for it.
            - Make sure that the questions cover all dates in the text. 
            - Format each question as a JSON object.
            - The question needs to have the form "In which year ... ?". 
            - Questions MUST only ask for the year of the event, not the full date.
            - Never used sentences like "According to the text" or reference "the text" or "the author" in the questions.

            **The text**
            ----
            ${corpus}
            ----
            **Output format (JSON array):**
            {   title: "A Generated title that tells what this text is about, without spoiling dates", 
                shortTitle: "A generated 2 words title for the text", 
                questions: [
                    {
                        "question": "QUESTION TEXT HERE",
                        "correctYear": number representing the year of the event,
                    },
                ...
                ]
            }
            FORMAT THE OUTPUT IN JSON. DO NOT ADD OTHER TEXT. 
        `

        const llmResponse = await new LLMAPI(this.execContext, this.authHeader).prompt(prompt, "json");

        // For each generated flashcard in promisesResult, generate a DateFC 
        const generatedFlashcards: DateFC[] = llmResponse.value.questions.map(
            
            (flashcard: { question: string; correctYear: number; }) => {

                const fc = new DateFC(this.user, this.topicId, this.topicCode, this.sectionCode, llmResponse.value.title, llmResponse.value.shortTitle, flashcard.question, flashcard.correctYear);

                return fc;
            }
        );

        // Sort the flashcards by the correctYear
        generatedFlashcards.sort((a, b) => a.correctYear - b.correctYear);

        return generatedFlashcards;

    }

}