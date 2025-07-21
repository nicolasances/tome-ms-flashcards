import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { PostFlashcard } from "./dlg/PostFlashcard";
import { OnTopicEvent } from "./evt/OnTopicEvent";
import { GetFlashcards } from "./dlg/GetFlashcards";
import { GenerateFlashcards } from "./dlg/GenerateFlashcards";

const api = new TotoAPIController("tome-ms-flashcards", new ControllerConfig())

api.path('POST', '/flashcards', new PostFlashcard())
api.path('GET', '/flashcards', new GetFlashcards())

api.path('POST', '/corpus/flashcards', new GenerateFlashcards());

api.path('POST', '/events/topic', new OnTopicEvent())

api.init().then(() => {
    api.listen()
});