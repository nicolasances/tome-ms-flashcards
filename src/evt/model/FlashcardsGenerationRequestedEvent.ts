
export class FlashcardsGenerationRequestedEvent {
    topicCode: string;
    topicId: string;
    sectionCode: string;
    user: string;
    flashcardsType: string;

    constructor(topicCode: string, topicId: string, sectionCode: string, user: string, flashcardsType: string) {
        this.topicCode = topicCode;
        this.topicId = topicId;
        this.sectionCode = sectionCode;
        this.user = user;
        this.flashcardsType = flashcardsType;
    }
}