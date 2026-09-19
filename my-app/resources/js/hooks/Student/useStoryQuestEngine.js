import { useGameplayCore } from "./useGameplayCore";

// Story Quest (Speak mode) engine — save endpoint fixed to paragraph progress.
// Sentence batching stays in GameplaySpeakMode (it needs module.content closure).
export function useStoryQuestEngine({ saveEndpoint = "/student/saveParagraphProgress", ...rest }) {
    return useGameplayCore({ ...rest, saveEndpoint });
}
