import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { PostFlashcard } from "./dlg/PostFlashcard";
import { OnTopicEvent } from "./evt/OnTopicEvent";

const api = new TotoAPIController("tome-ms-flashcards", new ControllerConfig())

api.path('POST', '/flashcards', new PostFlashcard())

api.path('POST', '/events/topic', new OnTopicEvent())

api.init().then(() => {
    api.listen()
});