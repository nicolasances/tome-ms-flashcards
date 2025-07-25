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

    static generation() {
        return "t5"
    }

    async generateFlashcards(corpus: string): Promise<SectionTimelineFC[]> {

        const prompt = `
            You are an assistant that creates quiz cards from a historical or non-fictional text.

            **Your task:**
            From the given text, extract all events and facts into a timeline with **only one correct sequence of events**.

            ** Definitions ** 
            An event, in this context, is a fact or happening (event) that have a temporal meaning and can be placed in a timeline.

            **Instructions:**
            STEPS TO FOLLOW: 
            1. Read the text carefully.
            2. Determine whether it contains a sequence of historical events or facts.
                2a. If it does (even if dates are not necessarily available), extract all events from the text. 
                2b. If it does not (i.e. the text does not contain sequence(s) of historical events, but rather description of process, situation, historical situation, concepts, or other non-event facts) return null.
            3. List all events in chronological order. 
            4. VERY IMPORTANT STEP: Filter events, EXCLUDING events based on the following logic:
             - If multiple actions or achievements are listed together (e.g. “he did A. he did B. he did C”), only include them if their **temporal order is explicitly given** THROUGH WORDS LIKE "before, after, earlier, later". 
             - Otherwise, if no words like "before, then, after, earlier, later" or similar are used, DISCARD them.
            These are some examples of correct filtering: 
            
            EXAMPLE 1: 
            corpus: "He will first fight in Spain to support the Zaragoza Arabs against the Cordoba Arabs, but will not endure long there. After that, he will fight in Hungary"
            expected result: **include** two events: 
             - He will first fight in Spain to support the Zaragoza Arabs against the Cordoba Arabs (correctIndex: 0)
             - He will fight in Hungary (correctIndex: 1)

            EXAMPLE 2: 
            corpus: "He will first fight in Spain to support the Zaragoza Arabs against the Cordoba Arabs, but will not endure long there. He will fight in Hungary"
            expected result: **DISCARD** from timeline


            INSTRUCTIONS FOR THE TIMELINE:
            - The timeline can ONLY contain events that are EXPLICITLY mentioned in the text. ONLY use dates that are in the text.
            - Make sure that all events from the text that have a temporal order are included in the timeline.
            - The timeline should be in chronological order. If no date is available, use the order in which events and facts appear in the text. 
            - Events should be well described, but not too long. Aim for 1-3 sentences per event.

            **The text**
            ----
            ${corpus}
            ----
            **Output format (JSON array):**
            {   title: "A Generated title that tells what this text is about", 
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