import { WithId } from "mongodb";
import { Card } from "./Card";
import { Request } from "express";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

/**
 * This class models a flash card that: 
 *  - Asks a question
 *  - Gives multiple options
 *  - of which ONLY ONE is valid
 */
export class MultipleOptionsFC implements Card {

    id?: string
    type: string = 'options'
    user: string
    topicId: string
    topicCode: string;
    question: string;
    options: string[];
    rightAnswerIndex: number;

    constructor(
        user: string,
        topicId: string,
        topicCode: string,
        question: string,
        options: string[],
        rightAnswerIndex: number
    ) {
        this.user = user;
        this.topicId = topicId;
        this.topicCode = topicCode;
        this.question = question;
        this.options = options;
        this.rightAnswerIndex = rightAnswerIndex;
    }

    toBSON() {
        return { user: this.user, type: this.type, topicId: this.topicId, topicCode: this.topicCode, question: this.question, options: this.options, rightAnswerIndex: this.rightAnswerIndex }
    }

    /**
     * This method takes the options and shuffles them randomly. 
     * It also aligns the right answer index to the new shuffled options.
     */
    shuffleOptions(): void {

        // Create an array of indices
        const indices = Array.from({ length: this.options.length }, (_, i) => i)

        // Shuffle the indices array
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Reorder options and update rightAnswerIndex
        const newOptions = indices.map(idx => this.options[idx]);
        const newRightAnswerIndex = indices.indexOf(this.rightAnswerIndex);

        this.options = newOptions;
        this.rightAnswerIndex = newRightAnswerIndex;

    }

    static fromRequest(req: Request, user: string): MultipleOptionsFC {

        const body = req.body;

        // Validate mandatory fields
        if (!body.topicCode) throw new ValidationError(400, "No topic code provided");
        if (!body.topicId) throw new ValidationError(400, "No topic id provided");
        if (!body.question) throw new ValidationError(400, "No question provided");
        if (!body.options || body.options.length < 2) throw new ValidationError(400, "No (or not enough) options provided");
        if (!body.rightAnswerIndex) throw new ValidationError(400, "No right answer provided");

        return new MultipleOptionsFC(user, body.topicId, body.topicCode, body.question, body.options, body.rightAnswerIndex)

    }

    static fromBSON(bson: WithId<any>): MultipleOptionsFC {

        const card = new MultipleOptionsFC(bson.user, bson.topicId, bson.topicCode, bson.question, bson.options, bson.rightAnswerIndex)
        card.id = bson._id.toHexString()

        return card

    }

}