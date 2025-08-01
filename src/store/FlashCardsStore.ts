import { Db } from "mongodb";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { ControllerConfig } from "../Config";
import { Card, FlashcardFactory } from "../cards/Card";

export class FlashCardsStore {

    db: Db;
    dbName: string;
    collections: { cards: string; };

    constructor(db: Db, execContext: ExecutionContext) {
        this.db = db;
        this.dbName = (execContext.config as ControllerConfig).getDBName()
        this.collections = (execContext.config as ControllerConfig).getCollections()
    }

    /**
     * Saves the provided flash card
     * 
     * @param fc the flashcard to save
     * @returns the inserted id
     */
    async saveFlashCard(fc: Card): Promise<string> {

        const result = await this.db.collection(this.collections.cards).insertOne(fc.toBSON());

        return result.insertedId.toHexString()
    }

    /**
     * Saves a bulk of flashcards
     * 
     * @param fc the flashcards to save
     * 
     */
    async saveFlashCards(fc: Card[]): Promise<number> {

        const result = await this.db.collection(this.collections.cards).insertMany(fc.map(card => card.toBSON()))

        return result.insertedCount;

    }

    /**
     * Deletes all flashcards of the specified user for the specified topic
     * 
     * @param topicId the topic id
     * @param user the owner of the flashcards
     * @returns the deleted count
     */
    async deleteAllFlashcards(topicId: string, user: string): Promise<number> {

        const result = await this.db.collection(this.collections.cards).deleteMany({ topicId: topicId})

        return result.deletedCount;
    }

    /**
     * Deletes all flashcards of the specified user for the specified topic
     * 
     * @param topicId the topic id
     * @param user the owner of the flashcards
     * @returns the deleted count
     */
    async deleteAllSectionFlashcards(topicId: string, user: string, sectionCode: string, type: string): Promise<number> {

        const result = await this.db.collection(this.collections.cards).deleteMany({ topicId: topicId, sectionCode: sectionCode, type: type, user: user });

        return result.deletedCount;
    }

    /**
     * Returns the list of cards for the specified topic 
     * 
     * @param topicId the topic Id
     * @returns the list of cards for that topic
     */
    async getFlashcards(topicId: string): Promise<Card[]> {

        const cards = await this.db.collection(this.collections.cards).find({ topicId: topicId }).toArray()

        return cards.map(card => FlashcardFactory.newFlashcardFromBson(card))

    }

}

