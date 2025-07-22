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
    sectionCode: string;

    constructor(execContext: ExecutionContext, request: Request, user: string, topicCode: string, topicId: string, sectionCode: string) {
        this.execContext = execContext;
        this.authHeader = String(request.headers['authorization'] ?? request.headers['Authorization']);
        this.user = user;
        this.topicCode = topicCode;
        this.sectionCode = sectionCode;
        this.topicId = topicId;
    }

    async generateFlashcards(corpus: string): Promise<SectionTimelineFC[]> {

        const prompt = `
            You are an assistant that creates quiz cards from a historical or non-fictional text.

            **Your task:**
            From the given text, extract all events and facts into a timeline with **only one correct sequence of events**.

            **Instructions:**
            STEPS TO FOLLOW: 
            1. Read the text carefully.
            2. Identify if the text actually contains a sequence of historical events or facts.
            2a. If it does (even if dates are not necessarily available), extract all events and facts into a timeline. 
            2b. If it does not (i.e. the text does not contain sequence(s) of historical events, but rather description of process, situation, historical situation, concepts, or other non-event facts) return null.

            INSTRUCTIONS FOR THE TIMELINE:
            - The timeline can ONLY contain facts and events that are EXPLICITLY mentioned in the text. ONLY use dates that are in the text.
            - Make sure that all events and facts from the text are included in the timeline.
            - For each event or fact, provide the date (if and ONLY IF available)
            - The timeline should be in chronological order. If no date is available, use the order in which events and facts appear in the text. 
            - Events should be well described, but not too long. Aim for 1-3 sentences per event.

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
            RETURN null IF THE TEXT DOES NOT CONTAIN A SEQUENCE OF HISTORICAL EVENTS, as specified in the instructions.
            FORMAT THE OUTPUT IN JSON. DO NOT ADD OTHER TEXT. 
        `

        const llmResponse = await new LLMAPI(this.execContext, this.authHeader).prompt(prompt, "json");

        // If there is no timelien to generate
        if (llmResponse.value == null) return [];

        const card = new SectionTimelineFC(this.user, this.topicId, this.topicCode, this.sectionCode, llmResponse.value.events, llmResponse.value.title);

        // Shuffle the events
        card.shuffleEvents();

        return [card];

    }

}