import { LLMPromptResponse } from "../../../api/LLMAPI";
import { HistoricalGraphFC } from "../../model/HistoricalGraphFC";
import { LLMPrompt } from "../LLMPrompt";

export class GraphBuilderPrompt implements LLMPrompt<HistoricalGraphFC | null> {

    topicId: string;
    topicCode: string;
    sectionCode: string;
    sectionIndex: number;
    user: string;

    constructor({ topicId, topicCode, sectionCode, sectionIndex, user }: { topicId: string; topicCode: string; sectionCode: string; sectionIndex: number; user: string; }) {
        this.topicId = topicId;
        this.topicCode = topicCode;
        this.sectionCode = sectionCode;
        this.sectionIndex = sectionIndex;
        this.user = user;
    }

    getPrompt({ corpus }: { corpus: string; }): string {

        return `
            You are an assistant that creates historical graphs from a historical text. 

            **Your task:**
            From the given text, build a historical graph that contains all events in the text placing them in the right historical order. 

            **Instructions:**
            - Read the text carefully. 
            - If this does not fit the following criteria, return null: 
                1. It has to be a historical text, i.e. a text that describes a sequence of historical events.
                2. It has to contain a sequence of events that are connected in a causal or chronological way.
            - Extract all historical events and sort them by **chronological** or **causal** order. 
            - Track whether the link between two events is causal or purely chronological.
            - Separately extract all facts (i.e. interesting facts, concepts, things that are not events) from the text. 
            - Events should be well described, but not too long. Aim for 1-3 sentences per event. AVOID putting dates in the description of the event.
            - In the event description, use the following markup: 
                - Wrap name of people in a tag <name>...</name>
                - Wrap names of places in a tag <place>...</place>
                - Wrap the most important words (max 2) in a tag <important>...</important>

            **Constraints:**
            - Do not make up dates if they are not in the text. Dates must be EXPLICITLY WRITTEN in the text. 
            - DO NOT INCLUDE CENTURIES - CENTURIES ARE NOT DATES
            - The Event description should not contain dates. 
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
                        "eventCode": "a unique short code for the event this fact is connected to, or null if not related to any event",
                    }
                ]
            }
            RETURN null IF THE TEXT DOES NOT CONTAIN A SEQUENCE OF HISTORICAL EVENTS.
            FORMAT THE OUTPUT IN JSON. DO NOT ADD OTHER TEXT. 
        `
    }

    parseResponse(llmResponse: LLMPromptResponse): HistoricalGraphFC | null {

         if (!llmResponse || !llmResponse.value || !llmResponse.value.eventGraph) {
            return null;
        }

        const graph = HistoricalGraphFC.fromLLMResponse(llmResponse, this.topicId, this.topicCode, this.sectionCode, this.sectionIndex, this.user)

        return graph;
    }

}

