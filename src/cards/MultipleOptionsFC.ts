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
    user: string
    topicCode: string;
    question: string;
    options: string[];
    rightAnswerIndex: number;

    constructor(
        user: string,
        topicCode: string,
        question: string,
        options: string[],
        rightAnswerIndex: number
    ) {
        this.user = user;
        this.topicCode = topicCode;
        this.question = question;
        this.options = options;
        this.rightAnswerIndex = rightAnswerIndex;
    }

    toBSON() {
        return { user: this.user, topicCode: this.topicCode, question: this.question, options: this.options, rightAnswerIndex: this.rightAnswerIndex }
    }

    static fromRequest(req: Request, user: string): MultipleOptionsFC {

        const body = req.body;

        // Validate mandatory fields
        if (!body.topicCode) throw new ValidationError(400, "No topic code provided"); 
        if (!body.question) throw new ValidationError(400, "No question provided"); 
        if (!body.options || body.options.length < 2) throw new ValidationError(400, "No (or not enough) options provided"); 
        if (!body.rightAnswerIndex) throw new ValidationError(400, "No right answer provided"); 

        return new MultipleOptionsFC(user, body.topicCode, body.question, body.options, body.rightAnswerIndex)

    }

    static fromBSON(bson: WithId<any>): MultipleOptionsFC {

        const card = new MultipleOptionsFC(bson.user, bson.topicCode, bson.question, bson.options, bson.rightAnswerIndex)
        card.id = bson._id.toHexString()

        return card

    }

}