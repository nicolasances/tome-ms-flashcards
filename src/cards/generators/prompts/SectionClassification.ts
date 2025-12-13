import { LLMPromptResponse } from "../../../api/LLMAPI";
import { LLMPrompt } from "../LLMPrompt";

export class SectionClassificationPrompt implements LLMPrompt<SectionClassification> {

    parseResponse(llmResponse: LLMPromptResponse): SectionClassification {

        if (!llmResponse || !llmResponse.value || !llmResponse.value.eventGraph) {
            return {
                containsTimeline: llmResponse.value.containsTimeline,
                typeOfInfo: llmResponse.value.typeOfInfo,
                period: llmResponse.value.period
            };
        }

        return llmResponse.value as SectionClassification;
        
    }

    getPrompt({corpus}: {corpus: string}): string {
       return `
           Look at the following text: 
           ---- 
           ${corpus}
           ---- 
           Consider that this text is just one section of a wider set of notes on the topic. Answer the following questions: 
           1. Does this text contain a timeline of historical events? 
           2. Is this text mostly containing contextual information on a period or mostly describing a timeline? 
           3. Is this text generally describing a period or specifically explaining events in a sequence?
   
           Answer to those three questions in a JSON format. The format should be 
           {
            "containsTimeline": boolean, 
            "typeOfInfo": "contextual" | "timeline", 
            "period": "descriptive" | "sequence"
           }
           ONLY ANSWER WITH JSON. NO OTHER TEXT. 
       `
   }
}

export interface SectionClassification {
   containsTimeline: boolean;
   typeOfInfo: "contextual" | "timeline";
   period: "descriptive" | "sequence";
}