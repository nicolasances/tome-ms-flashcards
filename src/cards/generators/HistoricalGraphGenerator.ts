import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { LLMAPI, LLMPromptResponse } from "../../api/LLMAPI";
import { Request } from "express";
import { HistoricalGraphFC } from "../model/HistoricalGraphFC";
import { FlashcardsGenerator } from "./IFlashcardsGenerator";
import { log } from "console";

export class HistoricalGraphGenerator implements FlashcardsGenerator {

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
        return "gr1"
    }

    async generateFlashcards(corpus: string): Promise<HistoricalGraphFC[]> {

        const logger = this.execContext.logger;
        const cid = this.execContext.cid;

        const prompt = `
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
            - Events should be well described, but not too long. Aim for 1-3 sentences per event.
            - In the event description, use the following markup: 
                - Wrap name of people in a tag <name>...</name>
                - Wrap names of places in a tag <place>...</place>
                - Wrap the most important words (max 2) in a tag <important>...</important>

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
                        "eventCode": "a unique short code for the event this fact is connected to, or null if not related to any event",
                    }
                ]
            }
            RETURN null IF THE TEXT DOES NOT CONTAIN A SEQUENCE OF HISTORICAL EVENTS.
            FORMAT THE OUTPUT IN JSON. DO NOT ADD OTHER TEXT. 
        `

        const llmResponse = await new LLMAPI(this.execContext, this.authHeader).prompt(prompt, "json");

        logger.compute(cid, `LLM response for historical graph generation: ${JSON.stringify(llmResponse)}`);

        if (!llmResponse || !llmResponse.value || !llmResponse.value.eventGraph) {
            return [];
        }

        const graph = HistoricalGraphFC.fromLLMResponse(llmResponse, this.topicId, this.topicCode, this.sectionCode, this.user)

        // 2. Step two
        const promptStep2 = `
            You are an assistant that creates historical graphs from a historical text. 

            **Your task:**
            Given the follow text and graph, you will build one question for each event in the graph. 

            **Instructions:**
            - Read the text and analyze the graph carefully. 
            - For each event in the graph, generate a question on the event, with multiple choice answers. Follow these rules: 
                1. If the event is a consequence of a previous event, ask what happened as a consequence of the previous event.
                2. If the event is not a consequence of a previous event, ask what happened in the event.
                1. Avoid questions on dates and names
                2. Max 4 answers, only one is correct
                3. Don't use "all of the above" or "none of the above" as an answer

            **Constraints:**
            - Do not make up dates if they are not in the text. Dates must be EXPLICITLY WRITTEN in the text. 
            - Do not translate centuries into a date. E.g. "starts in the 10th century" should not be translated into "900".
            - Do not make up events or facts that are not in the text.
            - STRICTLY restrict yourself to the text and graph provided.

            **The text**
            ----
            ${corpus}
            ----

            **The graph**
            ----
            ${JSON.stringify(graph)}
            ----

            **Output format (JSON array):**
            [ 
                {
                    "eventCode": "the code of the event this question is about",
                    "question": "The question about the event",
                    "answers": ["answer 1", "answer 2", "answer 3", "answer 4"], // 4 answers, only one is correct
                    "correctAnswerIndex": 0 // index of the correct answer in the answers array
                }
            ]
            RETURN null IF THE TEXT DOES NOT CONTAIN A SEQUENCE OF HISTORICAL EVENTS.
            FORMAT THE OUTPUT IN JSON. DO NOT ADD OTHER TEXT. 
        `

        const llmResponsePart2 = await new LLMAPI(this.execContext, this.authHeader).prompt(promptStep2, "json");

        logger.compute(cid, `LLM response for historical graph questions generation: ${JSON.stringify(llmResponsePart2)}`);

        if (!llmResponsePart2 || !llmResponsePart2.value || !Array.isArray(llmResponsePart2.value)) {
            return [];
        }

        graph.addQuestions(llmResponsePart2.value.map((q: any) => ({
            eventCode: q.eventCode,
            question: q.question,
            answers: q.answers,
            correctAnswerIndex: q.correctAnswerIndex
        })));

        return [graph];
    }

}