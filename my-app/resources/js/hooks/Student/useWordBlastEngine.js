import { useGameplayCore } from "./useGameplayCore";

// Word Blast (Read mode) engine — save endpoint fixed to word progress.
// Mastery callbacks stay in GameplayReadMode (they need module/isTutorial closure).
export function useWordBlastEngine({ saveEndpoint = "/student/saveWordProgress", ...rest }) {
    // ponytail: Word Blast owns scope "word". Declared HERE, beside saveEndpoint,
    // because useGameplayCore is shared and cannot know which game is mounted —
    // and it is the only place that can, so the resume/pending records can be
    // told apart. Story Quest passes "para"; sentences are never shuffled, and
    // its order is semantic (useStoryQuestEngine rangesFromWords).
    return useGameplayCore({ ...rest, saveEndpoint, scope: "word" });
}
