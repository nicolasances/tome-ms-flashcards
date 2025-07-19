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
            You are an assistant that creates multiple-choice quiz cards from a historical or non-fictional text.

            **Your task:**
            From the given text, extract all events into a timeline with **only one correct sequence of events** and including fake events.

            **Instructions:**
            - Do not invent facts not supported by the text, except for the fake events. 
            - Make sure that all events from the text are included in the timeline.
            - For each event, provide the date (if available), and a flag indicating whether it is a real event or a fake one. 
            - For fake events you can make up a realistic date.
            - The timeline should be in chronological order.
            - Evevnts should be well described, but not too long. Aim for 1-2 sentences per event.

            **The text**
            ----
            ${corpus}
            ----
            **Output format (JSON array):**
            {   title: "A Generated title that tells what this text is about", 
                events: [
                    {
                        "event": "THE EVENT DESCRIPTION HERE",
                        "date":  "the date as a string formatted according to momentjs", // or null if no date is available. If the date is a year, format as YYYY 
                        "date-format": specifies a momentjs date format for the date
                        "real": boolean // true if the event is real, false if it is a fake event
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