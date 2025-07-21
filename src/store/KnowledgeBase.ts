import { Storage } from "@google-cloud/storage";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

/**
 * The knowledge base as stored on GCS. 
 * This is a utility class that provides methods to interact with the knowledge base.
 */
export class KnowledgeBase {
    bucketName: string
    kbBaseFolder: string = "kb"

    constructor() {
        this.bucketName = `${process.env['GCP_PID']}-tome-bucket`
    }

    /**
     * Get the content of a section file from the knowledge base.
     * 
     * @param topicCode the code of the topic
     * @param sectionCode the code of the section
     * @returns the content of the file read from GCS
     * @throws ValidationError if the file has not been found
     */
    async getSectionFile(topicCode: string, sectionCode: string): Promise<string> {

        // 1. Get the bucket
        const storage = new Storage();
        const bucket = storage.bucket(this.bucketName);

        // 2. Get the file from the bucket. Section files are stored under the path {kbBaseFolder}/{topicCode}/{sectionCode}.txt
        const filePath = `${this.kbBaseFolder}/${topicCode}/${sectionCode}.txt`;

        const file = bucket.file(filePath);

        // 3. Check if the file exists
        const [exists] = await file.exists();

        if (!exists) throw new ValidationError(404, `Section file ${filePath} not found in knowledge base.`);

        // 4. Read the file content
        const [content] = await file.download();
        
        return content.toString();

    }
}