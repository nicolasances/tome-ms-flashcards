import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { LLMAPI } from "../../api/LLMAPI";
import { Request } from "express";
import { SectionTimelineFC } from "../SectionTimelineFC";

export class SectionTimelineFCGenerator {

    execContext: ExecutionContext;
    authHeader: string;
    user: string;
    topicCode: string;
    topicId: string;

    constructor(execContext: ExecutionContext, request: Request, user: string, topicCode: string, topicId: string) {
        this.execContext = execContext;
        this.authHeader = String(request.headers['authorization'] ?? request.headers['Authorization']);
        this.user = user;
        this.topicCode = topicCode;
        this.topicId = topicId;
    }

    async generateFlashcards(corpus: string): Promise<SectionTimelineFC[]> {

        const prompt = `
            You are an assistant that creates quiz cards from a historical or non-fictional text.

            **Your task:**
            From the given text, extract all events and facts into a timeline with **only one correct sequence of events**.

            **Instructions:**
            - The timeline can ONLY contain facts and events that are EXPLICITLY mentioned in the text. ONLY use dates that are in the text.
            - Make sure that all events and facts from the text are included in the timeline.
            - For each event or fact, provide the date (if and ONLY IF available)
            - The timeline should be in chronological order. If no date is available, use the order in which events and facts appear in the text. 
            - Evevnts should be well described, but not too long. Aim for 1-3 sentences per event.

            **The text**
            ----
            ${corpus}
            ----
            **Output format (JSON array):**
            {   title: "A Generated title that tells what this text is about", 
                events: [
                    {
                        "event": "THE EVENT OR FACT DESCRIPTION HERE",
                        "date":  "the date as a string formatted according to momentjs", // or null if no date is available in the text. THE DATE MUST BE IN THE TEXT. If the date is a year, format as YYYY 
                        "dateFormat": specifies a momentjs date format for the date, 
                        "correctIndex": the index of the event or fact in the timeline, starting from 0. If an event or fact can be in other places in the timeline, set this to null.
                    },
                ...
                ]
            }
            FORMAT THE OUTPUT IN JSON. DO NOT ADD OTHER TEXT. 
        `

        const llmResponse = await new LLMAPI(this.execContext, this.authHeader).prompt(prompt, "json");

        const card = new SectionTimelineFC(this.user, this.topicId, this.topicCode, llmResponse.value.events, llmResponse.value.title);

        // Shuffle the events
        card.shuffleEvents();

        return [card];

    }

}