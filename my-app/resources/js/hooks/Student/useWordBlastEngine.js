import { useGameplayCore } from "./useGameplayCore";

// Word Blast (Read mode) engine — save endpoint fixed to word progress.
// Mastery callbacks stay in GameplayReadMode (they need module/isTutorial closure).
export function useWordBlastEngine({ saveEndpoint = "/student/saveWordProgress", ...rest }) {
    return useGameplayCore({ ...rest, saveEndpoint });
}
