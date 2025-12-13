import { LLMPromptResponse } from "../../api/LLMAPI";

export interface LLMPrompt<T> {

    getPrompt({corpus}: {corpus: string}): string;

    parseResponse(llmResponse: LLMPromptResponse): T;
    
}