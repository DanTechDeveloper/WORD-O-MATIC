// @vitest-environment happy-dom
// ponytail: this file locks ONE decision — "all badges at once, one tap".
// The burst is real, not hypothetical: BadgeTest::test_perfect_first_level_awards_expected_badge_set
// asserts a perfect 10/10 awards SIX badges, and checkAllEligibleBadges() on login can
// award every badge in the catalog. The old flow paged them one per tap, so a 6-badge
// round meant 6 taps and 6 fanfares before the kid saw their results.
//
// Assert 2 is the regression guard: if anyone re-introduces per-badge paging,
// "TAP FOR NEXT BADGE" comes back and this fails. The remaining asserts stop a
// silent "grid renders but is clipped" or "hero path broke" regression.
//
// Tests the MODAL directly, which is how both pages now call it (the old
// BadgeUnlockFlow wrapper was deleted — it only guarded an empty array, and the
// modal's own `!badges.length` guard already did that).
//
// Zero mocks beyond the two the component cannot survive without: usePage
// (deadline) and sounds (happy-dom has no Audio). ArcadeBackground is pure CSS.
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { readFileSync } from "fs";

vi.mock("@inertiajs/react", () => ({
    usePage: () => ({ props: { auth: { deadline: null } } }),
}));

vi.mock("@/utils/sounds", () => ({
    setBgmSilenced: () => {},
    pauseBackgroundMusic: () => {},
    startBackgroundMusic: () => {},
    playBadgeUnlockSound: () => {},
    playClickSound: () => {},
}));

const BadgeUnlockModal = (await import("@/Components/Student/BadgeUnlockModal.jsx")).default;

afterEach(() => cleanup());

// shaped like the two real payloads: flash.new_badges from the Dashboard/login
// path carries name/description/slug/icon only, NO current_value/threshold.
const b = (slug, name, icon) => ({
    slug,
    name,
    icon,
    description: `${name} description.`,
});

const BURST = [
    b("on-fire", "On Fire", "local_fire_department"),
    b("blazing-streak", "Blazing Streak", "whatshot"),
    b("unstoppable", "Unstoppable", "bolt"),
    b("first-steps", "First Steps", "eco"),
    b("clear-speaker", "Clear Speaker", "mic"),
    b("perfect-round", "Perfect Round", "workspace_premium"),
];

describe("BadgeUnlockModal", () => {
    test("renders every badge at once with a single continue button", () => {
        render(<BadgeUnlockModal badges={BURST} show onContinue={() => {}} />);

        for (const badge of BURST) {
            expect(screen.getByText(badge.name)).toBeTruthy();
        }

        const buttons = screen.getAllByRole("button");
        expect(buttons).toHaveLength(1);
        expect(buttons[0].textContent).toBe("TAP TO CONTINUE");
    });

    test("never renders TAP FOR NEXT BADGE", () => {
        render(<BadgeUnlockModal badges={BURST} show onContinue={() => {}} />);

        expect(screen.queryByText(/TAP FOR NEXT BADGE/)).toBeNull();
    });

    test("burst screen scrolls instead of clipping the list", () => {
        const { container } = render(<BadgeUnlockModal badges={BURST} show onContinue={() => {}} />);

        // overflow-hidden clipped a 6+ card grid with no way to reach the button.
        const scroller = container.querySelector(".overflow-y-auto");
        expect(scroller).not.toBeNull();
    });

    test("single badge keeps the hero path, one button, no burst header", () => {
        render(<BadgeUnlockModal badges={[BURST[0]]} show onContinue={() => {}} />);

        expect(screen.getByText("On Fire")).toBeTruthy();
        expect(screen.queryByText(/You unlocked \d+ new badges/)).toBeNull();
        expect(screen.queryByText("New Badge Unlocked!")).not.toBeNull();

        const buttons = screen.getAllByRole("button");
        expect(buttons).toHaveLength(1);
        expect(buttons[0].textContent).toBe("TAP TO CONTINUE");
    });

    test("one tap ends the whole burst", () => {
        let done = 0;
        render(<BadgeUnlockModal badges={BURST} show onContinue={() => done++} />);

        screen.getByRole("button").click();

        expect(done).toBe(1);
    });

    test("empty award renders nothing", () => {
        const { container } = render(<BadgeUnlockModal badges={[]} show onContinue={() => {}} />);

        expect(container.innerHTML).toBe("");
    });
});

// The "next badge" card used to render here as well as on GameResults. It is
// now GameResults-only: this modal also serves Dashboard, whose flash payload
// (name/description/slug/icon, no threshold) cannot supply one — so the prop
// existed for one of two callers and the `isBurst &&` gate leaked page logic
// into a shared component. These lock the new split.
describe("the next card lives on GameResults, not here", () => {
    test("the modal never renders a Next card, even if handed one", () => {
        render(
            <BadgeUnlockModal
                badges={BURST}
                show
                nextBadge={{ name: "Word Master", threshold: 50, current_value: 47 }}
                onContinue={() => {}}
            />,
        );

        // React drops the unknown prop, so this asserts the component has no
        // way to render one — not merely that the caller forgot to pass it.
        expect(screen.queryByText(/Next:/)).toBeNull();
    });

    test("the modal does not even accept the prop any more", () => {
        const src = readFileSync(
            "resources/js/Components/Student/BadgeUnlockModal.jsx",
            "utf8",
        );

        expect(src).not.toContain("nextBadge");
        expect(src).not.toContain("NextBadge");
    });

    test("GameResults still owns the card and still computes it", () => {
        const src = readFileSync(
            "resources/js/Pages/Student/GameResults.jsx",
            "utf8",
        );

        // Reuses the computation already on the page (highest-ratio unearned)
        // rather than inventing a second one.
        expect(src).toContain(".filter((b) => !b.is_earned)");
        expect(src).toContain("<NextBadge badge={nextBadge} />");
        // ...and that computation is scoped to the mode just played. Without
        // this the card reads the whole catalog, so a Word Blast round can point
        // the kid at Story Explorer (mode: paragraph) — same confusion the card
        // exists to prevent. Source-locked, not DOM-tested: rendering GameResults
        // needs six module mocks for one assertion (see the file's other locks).
        expect(src).toContain(
            'b.mode === session.module_type || b.mode === "shared"',
        );
    });
});

// The scroll container is overflow-y-auto, which means a 6-badge burst
// overflows a 667px phone and pushes the button below the fold. A source
// grep is the honest check here: happy-dom has no layout engine, so nothing
// that renders can tell us whether something is off-screen.
describe("continue button stays reachable", () => {
    const src = readFileSync(
        "resources/js/Components/Student/BadgeUnlockModal.jsx",
        "utf8",
    );

    test("the button wrapper is sticky at the bottom of the scroller", () => {
        expect(src).toContain("sticky bottom-0");
        // A sticky element only pins inside its nearest scrolling ancestor, so
        // the overflow-y-auto container is what makes this work at all.
        expect(src).toContain("overflow-y-auto");
    });

    test("sticky carries an opaque backdrop or the grid shows through it", () => {
        // Sticky floats the button OVER the scrolling cards. Without a gradient
        // from the page background, badge icons pass behind it while scrolling.
        expect(src).toMatch(/bg-gradient-to-t from-background/);
    });

    test("the button is centred, not stretched by the full-width wrapper", () => {
        // The wrapper is w-full so the fade spans the column; the button itself
        // must stay content-width, or the celebration grows a giant green slab.
        expect(src).toMatch(/<button[\s\S]{0,600}?mx-auto flex items-center/);
    });
});