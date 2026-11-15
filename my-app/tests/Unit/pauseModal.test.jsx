// @vitest-environment happy-dom
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

const GameplayHeader = (await import("@/Components/Student/GameplayHeader.jsx")).default;

afterEach(() => cleanup());

const baseProps = {
    level: "1 - Test",
    isActive: true,
    scoreEmphasize: false,
    wordsSmashed: 0,
    currentIndex: 0,
    totalWords: 5,
    onTimeUp: () => {},
    timeLeft: 60,
    mode: "read",
};

describe("GameplayHeader pause modal", () => {
    test("renders a pause button when not paused", () => {
        render(<GameplayHeader {...baseProps} isPaused={false} />);
        expect(screen.getAllByLabelText("Pause game").length).toBe(2);
    });

    test("renders pause modal copy when paused", () => {
        render(<GameplayHeader {...baseProps} isPaused={true} />);
        expect(screen.getByText("Game Paused")).toBeTruthy();
        expect(screen.getByText("Take a break. Your game is paused.")).toBeTruthy();
        expect(screen.getByText("Resume")).toBeTruthy();
        expect(screen.getByText("Continue your current game")).toBeTruthy();
        expect(screen.getByText("Exit to Home")).toBeTruthy();
        expect(screen.getByText("Leave the current game")).toBeTruthy();
    });

    test("resume and exit request callbacks fire", () => {
        const onResume = vi.fn();
        const onExitRequest = vi.fn();
        render(
            <GameplayHeader
                {...baseProps}
                isPaused={true}
                onResume={onResume}
                onExitRequest={onExitRequest}
            />,
        );
        fireEvent.click(screen.getByText("Resume"));
        expect(onResume).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByText("Exit to Home"));
        expect(onExitRequest).toHaveBeenCalledTimes(1);
    });

    test("renders exit confirmation modal when showExitConfirm", () => {
        render(<GameplayHeader {...baseProps} isPaused={true} showExitConfirm={true} />);
        expect(screen.getByText("Are you sure you want to exit?")).toBeTruthy();
        expect(screen.getByText("Your current game progress may be lost.")).toBeTruthy();
        expect(screen.getByText("Continue Playing")).toBeTruthy();
        expect(screen.getByText("Return to the pause screen")).toBeTruthy();
        expect(screen.getByText("Confirm exit")).toBeTruthy();
    });

    test("exit cancel and confirm callbacks fire", () => {
        const onExitCancel = vi.fn();
        const onExitConfirm = vi.fn();
        render(
            <GameplayHeader
                {...baseProps}
                isPaused={true}
                showExitConfirm={true}
                onExitCancel={onExitCancel}
                onExitConfirm={onExitConfirm}
            />,
        );
        fireEvent.click(screen.getByText("Continue Playing"));
        expect(onExitCancel).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByText("Exit to Home"));
        expect(onExitConfirm).toHaveBeenCalledTimes(1);
    });
});
