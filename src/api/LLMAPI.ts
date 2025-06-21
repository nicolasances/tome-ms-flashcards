
import http from "request";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { ControllerConfig } from "../Config";

export class LLMAPI {

    endpoint: string;
    cid: string | undefined;
    authHeader: string;

    constructor(execContext: ExecutionContext, authHeader: string) {
        this.endpoint = (execContext.config as ControllerConfig).getAPIsEndpoints()["toto-ms-llm"];
        this.cid = execContext.cid;
        this.authHeader = authHeader;
    }

    async prompt(prompt: string, outputFormat: "json" | "text"): Promise<LLMPromptResponse> {

        return await new Promise<LLMPromptResponse>((resolve, reject) => {
            http({
                uri: `${this.endpoint}/prompts`,
                method: 'POST',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    outputFormat: outputFormat
                })
            }, (err: any, resp: any, body: any) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        });
    }
}

export interface LLMPromptResponse {

    format: "json" | "text";
    value: any;
}