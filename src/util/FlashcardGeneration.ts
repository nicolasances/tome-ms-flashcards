import { DateFCGenerator } from "../cards/generators/DateFCGenerator";
import { HistoricalGraphGenerator } from "../cards/generators/HistoricalGraphGenerator";
import { MultipleOptionsFCGenerator } from "../cards/generators/MultipleOptionsFCGenerator";

export function getFlashcardsGeneration() {
    return `${HistoricalGraphGenerator.generation()}-${MultipleOptionsFCGenerator.generation()}-${DateFCGenerator.generation()}`;
}