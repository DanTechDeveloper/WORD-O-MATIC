// ponytail: wrapper for backward-compat — Students.jsx still imports ConfirmDeleteModal
import ConfirmModal from "./ConfirmModal";

export default function ConfirmDeleteModal(props) {
    return <ConfirmModal {...props} />;
}
