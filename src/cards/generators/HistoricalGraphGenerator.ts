import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { LLMAPI, LLMPromptResponse } from "../../api/LLMAPI";
import { Request } from "express";
import { SectionTimelineFC } from "../model/SectionTimelineFC";

export class HistoricalGraphGenerator {

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
        return "gr1"
    }

    async generateFlashcards(corpus: string): Promise<LLMPromptResponse> {

        const prompt = `
            You are an assistant that creates historical graphs from a historical text. 

            **Your task:**
            From the given text, build a historical graph that contains all events in the text placing them in the right historical order. 

            **Instructions:**
            - Read the text carefully. 
            - Extract all historical events and sort them by **chronological** or **causal** order. 
            - Track whether the link between two events is causal or purely chronological.
            - Separately extract all facts (i.e. interesting facts, concepts, things that are not events) from the text. 
            - Track reasons (causes) for events, if they are mentioned in the text.

            - Events should be well described, but not too long. Aim for 1-3 sentences per event.

            **Constraints:**
            - Do not make up dates if they are not in the text. Dates must be EXPLICITLY WRITTEN in the text. 
            - Do not translate centuries into a date. E.g. "starts in the 10th century" should not be translated into "900".
            - Do not make up events or facts that are not in the text.
            - STRICTLY restrict yourself to the text provided.

            **The text**
            ----
            ${corpus}
            ----

            **Output format (JSON array):**
            {   title: "A Generated title that tells what this text is about", // Avoid dates in the title
                shortTitle: "A generated 2 words title for the text", 
                summary: "Generate a summary of the whole text.",
                eventGraph: {
                    firstEvent: {
                        "code": "a unique short code for the event",
                        "event": "THE EVENT OR FACT DESCRIPTION HERE",
                        "reason": "the reason for the event, if explicitly mentioned in the text",
                        "date":  "the date as a string formatted according to momentjs", // or null if no date is available in the text. THE DATE MUST BE IN THE TEXT. If the date is a year just return the year as a string. 
                        "dateFormat": specifies a momentjs date format for the date, 
                        "nextEvent": {
                            event, date, dateFormat, 
                            link: "causal" | "chronological" // specifies whether the link between the this event and the previous is causal or purely chronological, 
                            nextEvent: {...}
                        }
                    }
                }, 
                facts: [ // an array of facts (i.e. are not events) contained in the text
                    {
                        "fact": "A fact description here. 1-3 sentences.", 
                        "eventCode": "a unique short code for the event this fact is connected to, or null if not related to any event"
                    }
                ]
            }
            RETURN null IF THE TEXT DOES NOT CONTAIN A SEQUENCE OF HISTORICAL EVENTS.
            FORMAT THE OUTPUT IN JSON. DO NOT ADD OTHER TEXT. 
        `

        const llmResponse = await new LLMAPI(this.execContext, this.authHeader).prompt(prompt, "json");

        return llmResponse;
    }

}