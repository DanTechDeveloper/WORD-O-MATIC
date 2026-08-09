export default function TableEmptyRow({ colSpan = 6, children }) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-6 py-10 text-center text-slate-600 font-black uppercase tracking-widest"
            >
                {children}
            </td>
        </tr>
    );
}