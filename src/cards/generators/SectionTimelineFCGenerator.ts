import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { LLMAPI } from "../../api/LLMAPI";
import { Request } from "express";
import { SectionTimelineFC } from "../model/SectionTimelineFC";
import { FlashcardsGenerator } from "./IFlashcardsGenerator";

export class SectionTimelineFCGenerator implements FlashcardsGenerator {

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

    generation() {
        return "t6"
    }

    async generateFlashcards(corpus: string): Promise<SectionTimelineFC[]> {

        const prompt = `
            You are an assistant that creates quiz cards from a historical or non-fictional text.

            **Your task:**
            From the given text, extract all events that have or can be **directly linked to a date that is explicitly mentioned in the text** into a timeline with **only one correct sequence of events**.

            **Instructions:**
            STEPS TO FOLLOW: 
            1. Read the text carefully.
            2. Determine whether it contains a sequence of historical events or facts.
                2a. If it does, extract all events from the text. Extract only those events that are explicitly mentioned in the text and can be linked to a date that is also mentioned in the text.
                2b. If it does not (i.e. the text does not contain sequence(s) of historical events, but rather description of process, situation, historical situation, concepts, or other non-event facts) return null.
            3. List all events in chronological order. 

            INSTRUCTIONS FOR THE TIMELINE:
            - The timeline can ONLY contain events that are EXPLICITLY mentioned in the text. ONLY use dates that are in the text.
            - Make sure that all events from the text that have a temporal order are included in the timeline.
            - The timeline should be in chronological order. If no date is available, use the order in which events and facts appear in the text. 
            - Events should be well described, but not too long. Aim for 1-3 sentences per event.
            - If the text mentions a **reason** for which an event happens, include it in the event description.
            - If the text mentions a **consequence** of an event, include it in the event description.
            - In the event description you should ALWAYS: 
                - Exclude dates
                - Exclude numbers and quantities (unless royal titles, e.g. "King Charles III")

            **The text**
            ----
            ${corpus}
            ----
            **Output format (JSON array):**
            {   title: "A Generated title that tells what this text is about", // Avoid dates in the title
                shortTitle: "A generated 2 words title for the text", 
                events: [
                    {
                        "event": "THE EVENT OR FACT DESCRIPTION HERE",
                        "date":  "the date as a string formatted according to momentjs", // or null if no date is available in the text. THE DATE MUST BE IN THE TEXT. If the date is a year just return the year as a string. 
                        "dateFormat": specifies a momentjs date format for the date, 
                        "correctIndex": the index of the event or fact in the timeline, starting from 0. 
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

        const card = new SectionTimelineFC(this.user, this.topicId, this.topicCode, this.sectionCode, llmResponse.value.events, llmResponse.value.title, llmResponse.value.shortTitle);

        // Shuffle the events
        card.shuffleEvents();

        return [card];

    }

}