import { useState } from "react";
import BadgeUnlockModal from "./BadgeUnlockModal";

export default function BadgeUnlockFlow({ badges = [], onDone }) {
    const [index, setIndex] = useState(0);
    const badge = badges[index];
    if (!badge) return null;

    const isLast = index + 1 >= badges.length;

    return (
        <BadgeUnlockModal
            badge={badge}
            show
            current={index + 1}
            total={badges.length}
            buttonText={isLast ? "TAP TO CONTINUE" : "TAP FOR NEXT BADGE"}
            onContinue={() => {
                if (isLast) {
                    // ponytail: hasNewBadge dot removed — keep modal flow, no localStorage
                    onDone?.();
                }
                setIndex(index + 1);
            }}
        />
    );
}