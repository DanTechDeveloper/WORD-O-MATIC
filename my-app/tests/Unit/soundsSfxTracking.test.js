// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { isSfxPlaying, isBgmPlaying } from "@/utils/sounds.js";

vi.mock("@inertiajs/react", () => ({ router: { on: vi.fn() } }));

describe("sounds SFX tracking", () => {
    it("reports no SFX playing initially", () => {
        expect(isSfxPlaying()).toBe(false);
    });

    it("reports BGM not playing initially", () => {
        expect(isBgmPlaying()).toBe(false);
    });
});