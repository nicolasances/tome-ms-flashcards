import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { LLMAPI } from "../../api/LLMAPI";
import { MultipleOptionsFC } from "../MultipleOptionsFC";
import { Request } from "express";

export class MultipleOptionsFCGenerator {

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

    static generation() {return "o1.0"}

    async generateFlashcards(corpus: string): Promise<MultipleOptionsFC[]> {

        const prompt = `
            You are an assistant that creates multiple-choice quiz cards from a historical or non-fictional text.

            **Your task:**
            From the given text, extract key facts and generate **multiple-choice questions** with **only one correct answer** and **3–4 answer options total** (including distractors).

            **Instructions:**
            - Do not invent facts not supported by the text.
            - Make sure that the questions cover all names
            - Questions should test all of the below: 
                + important names (of people, organizations, countries), 
                + dates, 
                + events, 
                + numbers, 
                + actions (e.g. "what did this person do?"), 
                + concepts (e.g. "what did this law consist of?") 
                + causes/effects.
            - Format each question as a JSON object.
            - When asking for dates, the options might also contain different decades, not just dates that are too close to each other
            - Each question must be clear. The context must be clear. Example of a poor question: "What happened to the 7 and 10-year-old children of the dead king?", because the user does not know "who the dead king is". A better question would be: "What happened to the 7 and 10-year-old children of King X, who died in 1234?".
            - Never used sentences like "According to the text" or reference "the text" in the questions.
            - Each object must include:  
                - "question": The question string  
                - "options": An array of 4 strings  
                - "answer": The exact correct index from the options array
            - Generally:
                - For short texts (~100-200 words), 5-10 questions is enough.
                - For medium (~500 words), 10-25 questions.
                - For longer or denser texts, generate between 25 and 50 questions.

            **The text**
            ----
            ${corpus}
            ----
            **Output format (JSON array):**
            {   title: "A Generated title that tells what this text is about, without spoiling dates", 
                questions: [
                    {
                        "question": "QUESTION TEXT HERE",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "answer": index of the right answer
                    },
                ...
                ]
            }
            FORMAT THE OUTPUT IN JSON. DO NOT ADD OTHER TEXT. 
        `

        const llmResponse = await new LLMAPI(this.execContext, this.authHeader).prompt(prompt, "json");

        // For each generated flashcard in promisesResult, generate a MultipleOptionsFC 
        const generatedFlashcards: MultipleOptionsFC[] = llmResponse.value.questions.map(
            (flashcard: { question: string; options: string[]; answer: number; }) => {

                const fc = new MultipleOptionsFC(this.user, this.topicId, this.topicCode, this.sectionCode, flashcard.question, flashcard.options, flashcard.answer)
                fc.sectionTitle = llmResponse.value.title; // Set the section title from the LLM response

                // Shuffle the options
                fc.shuffleOptions();

                return fc;
            }
        );

        return generatedFlashcards;

    }

}