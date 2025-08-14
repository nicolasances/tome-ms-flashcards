import { LLMPromptResponse } from "../../../api/LLMAPI";
import { HistoricalGraphFC } from "../../model/HistoricalGraphFC";
import { LLMPrompt } from "../LLMPrompt";

export class GraphQuestionsBuilder implements LLMPrompt<GraphQuestion[]> {

    graph: HistoricalGraphFC

    constructor(graph: HistoricalGraphFC) {
        this.graph = graph;
    }

    getPrompt({ corpus }: { corpus: string; }): string {
        return `
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
            ${JSON.stringify(this.graph)}
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
    }

    parseResponse(llmResponse: LLMPromptResponse): GraphQuestion[] {
        
        if (!llmResponse || !llmResponse.value || !Array.isArray(llmResponse.value)) {
            return [];
        }

        return llmResponse.value.map((q: any) => ({
            eventCode: q.eventCode,
            question: q.question,
            answers: q.answers,
            correctAnswerIndex: q.correctAnswerIndex
        }))
    }

}


export interface GraphQuestion {
    eventCode: string;
    question: string;
    answers: string[];
    correctAnswerIndex: number;
}