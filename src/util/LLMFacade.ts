import { Request } from "express";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { LLMAPI, LLMPromptResponse } from "../api/LLMAPI";
import { LLMPrompt } from "../cards/generators/LLMPrompt";

export class LLMFacade {

    execContext: ExecutionContext;
    authHeader: string;

    constructor(execContext: ExecutionContext, request: Request) {
        this.execContext = execContext;
        this.authHeader = String(request.headers['authorization'] ?? request.headers['Authorization']);
    }


    async invoke<T>(prompt: LLMPrompt<T>, corpus: string, llmRequestTrackingId: string): Promise<T> {

        const llmResponse = await new LLMAPI(this.execContext, this.authHeader).prompt(prompt.getPrompt({ corpus }), "json", llmRequestTrackingId)

        return prompt.parseResponse(llmResponse);
    }
}