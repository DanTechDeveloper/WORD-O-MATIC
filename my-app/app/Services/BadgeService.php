<?php

namespace App\Services;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\WordModule;

class BadgeService
{
    // ponytail: per-request memo — finishRound called getBadgeProgress + checkGameplayBadges
    // back-to-back, each re-ran curriculum/bestSentence/max. Static cache cuts 6-8 queries to 2.
    private static array $memo = [];

    private function memo(string $key, callable $fn) {
        if (app()->environment('testing')) return $fn();
        return static::$memo[$key] ??= $fn();
    }

    // Best streak/accuracy counts only non-deadline-hit sessions, so a post-deadline
    // round can't inflate badge progress — even if the deadline is later cleared
    // (doc: CAVEATS BF7/BF10). The flag is baked in at log time, so this is sticky.
    // ponytail: tutorial sessions excluded — streak/ON FIRE must not leak from onboarding (BadgesSeeder 19-21)
    private function bestSessionMetric(User $user, string $column): int
    {
        return $this->memo("best:{$user->id}:$column", function () use ($user, $column) {
            $tutIds = array_filter([
                WordModule::where('is_tutorial', true)->value('id'),
                ParagraphModule::where('is_tutorial', true)->value('id'),
            ]);
            return (int) GameSession::where('user_id', $user->id)
                ->where('is_deadline_hit', false)
                ->when($tutIds, fn ($q) => $q->whereNotIn('module_id', $tutIds))
                ->when($column === 'streak', fn ($q) => $q->where('module_type', 'word'))
                ->max($column) ?? 0;
        });
    }

    // ponytail: Sentence Star metric — best single-sentence score across real
    // paragraph rounds. Null/empty arrays contribute nothing; tutorial and
    // deadline-hit sessions excluded like every other session metric.
    public function calculateBestSentence(User $user): int
    {
        return $this->memo("bestSentence:{$user->id}", function () use ($user) {
            $tutParaId = ParagraphModule::where('is_tutorial', true)->value('id');
            $best = GameSession::where('user_id', $user->id)
                ->where('module_type', 'paragraph')
                ->where('is_deadline_hit', false)
                ->when($tutParaId, fn ($q) => $q->where('module_id', '!=', $tutParaId))
                ->get(['sentence_scores'])
                ->flatMap(fn ($s) => (array) ($s->sentence_scores ?? []))
                ->map(fn ($v) => (int) $v)
                ->max();
            return (int) ($best ?? 0);
        });
    }
    public function awardOnboardingBadge(User $user, string $slug): ?array
    {
        $badge = Badges::where('slug', $slug)->first();

        if (! $badge) {
            return null;
        }

        $changes = $user->badges()->syncWithoutDetaching([
            $badge->id => ['earned_at' => now(), 'status' => 'earned'],
        ]);

        if (empty($changes['attached'])) {
            return null;
        }

        return [
            'name' => $badge->name,
            'description' => $badge->description,
            'slug' => $badge->slug,
            'icon' => $badge->icon,
        ];
    }

    public function checkAllEligibleBadges(User $user): array
    {
        if (! app()->environment('testing')) static::$memo = [];
        $student = $user->student;

        if (! $student) {
            return [];
        }

        $awarded = [];
        $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        $actionBadges = [
            'profile-pioneer' => $student->avatar && ! in_array($student->avatar, ['/images/boy.svg', '/images/girl.svg']),
            'tutorial-complete' => ! is_null($student->tutorial_completed_at),
        ];

        foreach ($actionBadges as $slug => $satisfied) {
            if (! $satisfied) {
                continue;
            }

            $badge = Badges::where('slug', $slug)->whereNotIn('id', $earnedBadgeIds)->first();

            if (! $badge) {
                continue;
            }

            $user->badges()->syncWithoutDetaching([
                $badge->id => ['earned_at' => now(), 'status' => 'earned'],
            ]);

            $awarded[] = [
                'name' => $badge->name,
                'description' => $badge->description,
                'slug' => $badge->slug,
                'icon' => $badge->icon,
            ];
        }

        $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        $badgesToCheck = Badges::whereNotIn('id', $earnedBadgeIds)
            ->whereIn('metric', ['total_points', 'streak', 'accuracy', 'paragraph_completion', 'word_completion', 'best_sentence'])
            ->get()
            ->groupBy('metric');

        foreach ($badgesToCheck as $metric => $group) {
            $currentValue = match ($metric) {
                'total_points' => $student->points,
                'streak' => $this->bestSessionMetric($user, 'streak'),
                'accuracy' => max((float) $student->wordBlastAcc, (float) $student->storyQuestAcc),
                'paragraph_completion' => $this->calculateModuleCompletion($user, 'paragraph'),
                'word_completion' => $this->calculateModuleCompletion($user, 'word'),
                'best_sentence' => $this->calculateBestSentence($user),
                default => 0,
            };

            // ponytail: cumulative — award every threshold <= currentValue so 7/5 can't stay locked when 7/7 just earned
            foreach ($group->sortBy('threshold_score') as $badge) {
                if (! $this->meetsThreshold($currentValue, $badge->threshold_score)) {
                    continue;
                }
                $user->badges()->attach($badge->id, [
                    'earned_at' => now(),
                    'progress' => $currentValue,
                    'status' => 'earned',
                    'unlocked_session_id' => null,
                ]);
                $awarded[] = [
                    'name' => $badge->name,
                    'description' => $badge->description,
                    'slug' => $badge->slug,
                    'icon' => $badge->icon,
                ];
            }
        }

        return $awarded;
    }

    public function checkGameplayBadges(User $user, int $sessionId, float $accuracy): array
    {
        if (! app()->environment('testing')) static::$memo = [];
        $student = $user->student;

        if (! $student) {
            return [];
        }

        $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        $badgesToCheck = Badges::whereNotIn('id', $earnedBadgeIds)
            ->whereIn('metric', ['total_points', 'streak', 'accuracy', 'paragraph_completion', 'word_completion', 'best_sentence'])
            ->get();

        if ($badgesToCheck->isEmpty()) {
            return [];
        }

        $awarded = [];
        $grouped = $badgesToCheck->groupBy('metric');

        foreach ($grouped as $metric => $group) {
            $currentValue = match ($metric) {
                'total_points' => $student->points,
                'streak' => $this->bestSessionMetric($user, 'streak'),
                'accuracy' => $accuracy,
                'paragraph_completion' => $this->calculateModuleCompletion($user, 'paragraph'),
                'word_completion' => $this->calculateModuleCompletion($user, 'word'),
                'best_sentence' => $this->calculateBestSentence($user),
                default => 0,
            };

            // ponytail: cumulative — same as checkAllEligibleBadges, prevents 7/5 locked sibling
            foreach ($group->sortBy('threshold_score') as $badge) {
                if (! $this->meetsThreshold($currentValue, $badge->threshold_score)) {
                    continue;
                }
                $user->badges()->attach($badge->id, [
                    'earned_at' => now(),
                    'progress' => $currentValue,
                    'status' => 'earned',
                    'unlocked_session_id' => $sessionId,
                ]);
                $awarded[] = $badge;
            }
        }

        return $awarded;
    }

    public function getBadgeProgress(User $user, GameSession $session): array
    {
        if (! app()->environment('testing')) static::$memo = [];
        $student = $user->student;
        $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        $badges = Badges::whereIn('metric', ['total_points', 'streak', 'accuracy', 'paragraph_completion', 'word_completion', 'best_sentence', 'action'])->get();

        $progress = [];

        foreach ($badges as $badge) {
            $currentValue = match ($badge->metric) {
                'total_points' => $student ? $student->points : 0,
                'streak' => $this->bestSessionMetric($user, 'streak'),
                'accuracy' => (int) round((float) $session->accuracy),
                'paragraph_completion' => $this->calculateModuleCompletion($user, 'paragraph'),
                'word_completion' => $this->calculateModuleCompletion($user, 'word'),
                'best_sentence' => $this->calculateBestSentence($user),
                'action' => null,
                default => 0,
            };

            $progress[] = [
                'name' => $badge->name,
                'description' => $badge->description,
                'slug' => $badge->slug,
                'icon' => $badge->icon,
                'metric' => $badge->metric,
                'threshold' => $badge->threshold_score,
                'current_value' => $currentValue,
                'is_earned' => in_array($badge->id, $earnedBadgeIds),
            ];
        }

        return $progress;
    }

    public function calculateModuleCompletion(User $user, string $type): float
    {
        if ($type === 'paragraph') {
            return $this->memo("completion:{$user->id}:paragraph", function () use ($user) {
                $curriculum = ParagraphModule::curriculumForUser($user->id);
                $mastered = 0;
                $total = 0;
                foreach ($curriculum as $level) {
                    $mastered += $level['mastered_sentences'] ?? collect($level['sentence_stats'] ?? [])->where('mastery', 'mastered')->count();
                    $total += $level['total_sentences'] ?? count($level['sentence_stats'] ?? []);
                }
                if ($total === 0) return 0;
                return (int) round(min(100, ($mastered / $total) * 100));
            });
        }
        return $this->memo("completion:{$user->id}:word", function () use ($user) {
            $tutorialModule = WordModule::where('is_tutorial', true)->first();
            $total = WordModule::where('is_tutorial', false)->withCount('words')->get()->sum('words_count');
            if ($total === 0) return 0;
            $earned = StudentWordProgress::where('user_id', $user->id)
                ->when($tutorialModule, fn ($q) => $q->where('word_module_id', '!=', $tutorialModule->id))
                ->sum('words_smashed');
            return (int) round(min(100, ($earned / $total) * 100));
        });
    }

    private function meetsThreshold($value, $threshold): bool
    {
        return $value >= $threshold;
    }
}
