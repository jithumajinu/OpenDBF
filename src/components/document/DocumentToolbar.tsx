import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";

/** Page sizes at 96dpi (px). Extend this catalog when more paper formats are needed. */
export const PAPER_SIZES = {
    A4: { label: "A4", width: 794, height: 1123 },
} as const;
export type PaperSize = keyof typeof PAPER_SIZES;

interface DocumentToolbarProps {
    editor: Editor;
    paperSize: PaperSize;
    pageCount: number;
    onPaperSizeChange: (paperSize: PaperSize) => void;
    onPageCountChange: (pageCount: number) => void;
}

const HIGHLIGHT_COLORS = [
    { name: "green", value: "#b7f2c7" },
    { name: "pink", value: "#f7c7d8" },
    { name: "yellow", value: "#f5e7a3" },
    { name: "blue", value: "#cfe7ff" },
    { name: "purple", value: "#d8d1ff" },
    { name: "red", value: "#ffd3d3" },
];

const buttonClass = (active = false) => `flex h-7 w-7 items-center justify-center rounded-md text-sm text-[#24272ec7] transition ${active
    ? "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
    : "hover:bg-gray-100 hover:text-[#24272ec7] dark:text-[#24272ec7] dark:hover:bg-gray-700"}`;

export default function DocumentToolbar({ editor, paperSize, pageCount, onPaperSizeChange, onPageCountChange }: DocumentToolbarProps) {
    const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
    const [listMenuOpen, setListMenuOpen] = useState(false);
    const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);

    useEffect(() => {
        if (!headingMenuOpen && !listMenuOpen && !highlightMenuOpen) return;
        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target?.closest(".document-toolbar-menu")) {
                setHeadingMenuOpen(false);
                setListMenuOpen(false);
                setHighlightMenuOpen(false);
            }
        };
        window.addEventListener("mousedown", handlePointerDown);
        return () => window.removeEventListener("mousedown", handlePointerDown);
    }, [headingMenuOpen, listMenuOpen, highlightMenuOpen]);

    const closeMenus = () => {
        setHeadingMenuOpen(false);
        setListMenuOpen(false);
        setHighlightMenuOpen(false);
    };

    return (
        <>
            <div className="document-toolbar mb-1 flex flex-wrap items-center gap-0.5 border-y border-gray-200 bg-white px-1 py-0.5 text-[#24272ec7] dark:border-gray-700 dark:bg-gray-900 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0 [&_svg.tiptap-button-dropdown-small]:h-3 [&_svg.tiptap-button-dropdown-small]:w-3">
                <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={buttonClass()} aria-label="Undo">
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.70711 3.70711C10.0976 3.31658 10.0976 2.68342 9.70711 2.29289C9.31658 1.90237 8.68342 1.90237 8.29289 2.29289L3.29289 7.29289C2.90237 7.68342 2.90237 8.31658 3.29289 8.70711L8.29289 13.7071C8.68342 14.0976 9.31658 14.0976 9.70711 13.7071C10.0976 13.3166 10.0976 12.6834 9.70711 12.2929L6.41421 9H14.5C15.0909 9 15.6761 9.1164 16.2221 9.34254C16.768 9.56869 17.2641 9.90016 17.682 10.318C18.0998 10.7359 18.4313 11.232 18.6575 11.7779C18.8836 12.3239 19 12.9091 19 13.5C19 14.0909 18.8836 14.6761 18.6575 15.2221C18.4313 15.768 18.0998 16.2641 17.682 16.682C17.2641 17.0998 16.768 17.4313 16.2221 17.6575C15.6761 17.8836 15.0909 18 14.5 18H11C10.4477 18 10 18.4477 10 19C10 19.5523 10.4477 20 11 20H14.5C15.3536 20 16.1988 19.8319 16.9874 19.5052C17.7761 19.1786 18.4926 18.6998 19.0962 18.0962C19.6998 17.4926 20.1786 16.7761 20.5052 15.9874C20.8319 15.1988 21 14.3536 21 13.5C21 12.6464 20.8319 11.8012 20.5052 11.0126C20.1786 10.2239 19.6998 9.50739 19.0962 8.90381C18.4926 8.30022 17.7761 7.82144 16.9874 7.49478C16.1988 7.16813 15.3536 7 14.5 7H6.41421L9.70711 3.70711Z" fill="currentColor"></path></svg>
                </button>
                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={buttonClass()} aria-label="Redo">
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.7071 2.29289C15.3166 1.90237 14.6834 1.90237 14.2929 2.29289C13.9024 2.68342 13.9024 3.31658 14.2929 3.70711L17.5858 7H9.5C7.77609 7 6.12279 7.68482 4.90381 8.90381C3.68482 10.1228 3 11.7761 3 13.5C3 14.3536 3.16813 15.1988 3.49478 15.9874C3.82144 16.7761 4.30023 17.4926 4.90381 18.0962C6.12279 19.3152 7.77609 20 9.5 20H13C13.5523 20 14 19.5523 14 19C14 18.4477 13.5523 18 13 18H9.5C8.30653 18 7.16193 17.5259 6.31802 16.682C5.90016 16.2641 5.56869 15.768 5.34254 15.2221C5.1164 14.6761 5 14.0909 5 13.5C5 12.3065 5.47411 11.1619 6.31802 10.318C7.16193 9.47411 8.30653 9 9.5 9H17.5858L14.2929 12.2929C13.9024 12.6834 13.9024 13.3166 14.2929 13.7071C14.6834 14.0976 15.3166 14.0976 15.7071 13.7071L20.7071 8.70711C21.0976 8.31658 21.0976 7.68342 20.7071 7.29289L15.7071 2.29289Z" fill="currentColor"></path></svg>
                </button>

                {/* <div className="tiptap-separator" data-orientation="vertical" role="none"></div> */}

                <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-600" />

                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <div className="document-toolbar-menu relative">
                    <button type="button" onClick={() => setHeadingMenuOpen((open) => !open)} className={`${buttonClass(editor.isActive("heading"))} font-semibold`} aria-label="Open heading options">
                        <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6 3C6.55228 3 7 3.44772 7 4V11H17V4C17 3.44772 17.4477 3 18 3C18.5523 3 19 3.44772 19 4V20C19 20.5523 18.5523 21 18 21C17.4477 21 17 20.5523 17 20V13H7V20C7 20.5523 6.55228 21 6 21C5.44772 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3Z" fill="currentColor"></path></svg>
                        <svg width="24" height="24" className="tiptap-button-dropdown-small" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="currentColor"></path></svg>

                    </button>
                    {headingMenuOpen && (
                        <div className="absolute left-0 top-10 z-10 min-w-[170px] rounded-xl border border-gray-200 bg-[#0f172a] p-2 shadow-xl dark:border-gray-700">
                            {[1, 2, 3, 4].map((level) => (
                                <button key={level} type="button" onClick={() => { editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run(); closeMenus(); }} className="flex w-full rounded-lg px-2 py-1.5 text-left text-sm text-gray-200 hover:bg-white/10">H{level} Heading {level}</button>
                            ))}
                        </div>
                    )}
                </div>

                <span className="mx-1 h-5 w-px dark:bg-gray-600" />

                {/* {(["left", "center", "right", "justify"] as const).map((align) => (
                <button key={align} type="button" onClick={() => editor.chain().focus().setTextAlign(align).run()} className={buttonClass(editor.isActive({ textAlign: align }))} aria-label={`Align ${align}`} title={`Align ${align}`}>
                    <span className="text-xs">{align === "left" ? "≡" : align === "center" ? "≡" : align === "right" ? "≡" : "☷"}</span>
                </button>
            ))} */}



                <div className="document-toolbar-menu relative">
                    <button type="button" onClick={() => setListMenuOpen((open) => !open)} className={buttonClass(editor.isActive("bulletList") || editor.isActive("orderedList") || editor.isActive("taskList"))} aria-label="Open list options">
                        <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 6C7 5.44772 7.44772 5 8 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H8C7.44772 7 7 6.55228 7 6Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M7 12C7 11.4477 7.44772 11 8 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H8C7.44772 13 7 12.5523 7 12Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M7 18C7 17.4477 7.44772 17 8 17H21C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H8C7.44772 19 7 18.5523 7 18Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 6C2 5.44772 2.44772 5 3 5H3.01C3.56228 5 4.01 5.44772 4.01 6C4.01 6.55228 3.56228 7 3.01 7H3C2.44772 7 2 6.55228 2 6Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 11.4477 2.44772 11 3 11H3.01C3.56228 11 4.01 11.4477 4.01 12C4.01 12.5523 3.56228 13 3.01 13H3C2.44772 13 2 12.5523 2 12Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 18C2 17.4477 2.44772 17 3 17H3.01C3.56228 17 4.01 17.4477 4.01 18C4.01 18.5523 3.56228 19 3.01 19H3C2.44772 19 2 18.5523 2 18Z" fill="currentColor"></path></svg>
                        <svg width="24" height="24" className="tiptap-button-dropdown-small" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="currentColor"></path></svg>
                    </button>
                    {listMenuOpen && (
                        <div className="absolute left-0 top-10 z-10 min-w-[180px] rounded-xl border border-gray-200 bg-[#0f172a] p-2 shadow-xl dark:border-gray-700">
                            {[
                                { key: "bulletList", label: "Bullet List" },
                                { key: "orderedList", label: "Ordered List" },
                                { key: "taskList", label: "Task List" },
                            ].map((item) => (
                                <button key={item.key} type="button" onClick={() => { if (item.key === "bulletList") editor.chain().focus().toggleBulletList().run(); else if (item.key === "orderedList") editor.chain().focus().toggleOrderedList().run(); else editor.chain().focus().toggleTaskList().run(); closeMenus(); }} className="flex w-full rounded-lg px-2 py-1.5 text-left text-sm text-gray-200 hover:bg-white/10">
                                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 6C7 5.44772 7.44772 5 8 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H8C7.44772 7 7 6.55228 7 6Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M7 12C7 11.4477 7.44772 11 8 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H8C7.44772 13 7 12.5523 7 12Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M7 18C7 17.4477 7.44772 17 8 17H21C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H8C7.44772 19 7 18.5523 7 18Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 6C2 5.44772 2.44772 5 3 5H3.01C3.56228 5 4.01 5.44772 4.01 6C4.01 6.55228 3.56228 7 3.01 7H3C2.44772 7 2 6.55228 2 6Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 11.4477 2.44772 11 3 11H3.01C3.56228 11 4.01 11.4477 4.01 12C4.01 12.5523 3.56228 13 3.01 13H3C2.44772 13 2 12.5523 2 12Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 18C2 17.4477 2.44772 17 3 17H3.01C3.56228 17 4.01 17.4477 4.01 18C4.01 18.5523 3.56228 19 3.01 19H3C2.44772 19 2 18.5523 2 18Z" fill="currentColor"></path></svg>

                                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24"
                                        fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M9 6C9 5.44772 9.44772 5 10 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H10C9.44772 7 9 6.55228 9 6Z"
                                            fill="currentColor"></path>
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M9 12C9 11.4477 9.44772 11 10 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H10C9.44772 13 9 12.5523 9 12Z"
                                            fill="currentColor"></path>
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M9 18C9 17.4477 9.44772 17 10 17H21C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H10C9.44772 19 9 18.5523 9 18Z"
                                            fill="currentColor"></path>
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M3 6C3 5.44772 3.44772 5 4 5H5C5.55228 5 6 5.44772 6 6V10C6 10.5523 5.55228 11 5 11C4.44772 11 4 10.5523 4 10V7C3.44772 7 3 6.55228 3 6Z"
                                            fill="currentColor"></path>
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M3 10C3 9.44772 3.44772 9 4 9H6C6.55228 9 7 9.44772 7 10C7 10.5523 6.55228 11 6 11H4C3.44772 11 3 10.5523 3 10Z"
                                            fill="currentColor"></path>
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M5.82219 13.0431C6.54543 13.4047 6.99997 14.1319 6.99997 15C6.99997 15.5763 6.71806 16.0426 6.48747 16.35C6.31395 16.5814 6.1052 16.8044 5.91309 17H5.99997C6.55226 17 6.99997 17.4477 6.99997 18C6.99997 18.5523 6.55226 19 5.99997 19H3.99997C3.44769 19 2.99997 18.5523 2.99997 18C2.99997 17.4237 3.28189 16.9575 3.51247 16.65C3.74323 16.3424 4.03626 16.0494 4.26965 15.8161C4.27745 15.8083 4.2852 15.8006 4.29287 15.7929C4.55594 15.5298 4.75095 15.3321 4.88748 15.15C4.96287 15.0495 4.99021 14.9922 4.99911 14.9714C4.99535 14.9112 4.9803 14.882 4.9739 14.8715C4.96613 14.8588 4.95382 14.845 4.92776 14.8319C4.87723 14.8067 4.71156 14.7623 4.44719 14.8944C3.95321 15.1414 3.35254 14.9412 3.10555 14.4472C2.85856 13.9533 3.05878 13.3526 3.55276 13.1056C4.28839 12.7378 5.12272 12.6934 5.82219 13.0431Z"
                                            fill="currentColor"></path>
                                    </svg>

                                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24"
                                        fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M2 6C2 4.89543 2.89543 4 4 4H8C9.10457 4 10 4.89543 10 6V10C10 11.1046 9.10457 12 8 12H4C2.89543 12 2 11.1046 2 10V6ZM8 6H4V10H8V6Z"
                                            fill="currentColor"></path>
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M9.70711 14.2929C10.0976 14.6834 10.0976 15.3166 9.70711 15.7071L5.70711 19.7071C5.31658 20.0976 4.68342 20.0976 4.29289 19.7071L2.29289 17.7071C1.90237 17.3166 1.90237 16.6834 2.29289 16.2929C2.68342 15.9024 3.31658 15.9024 3.70711 16.2929L5 17.5858L8.29289 14.2929C8.68342 13.9024 9.31658 13.9024 9.70711 14.2929Z"
                                            fill="currentColor"></path>
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M12 6C12 5.44772 12.4477 5 13 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H13C12.4477 7 12 6.55228 12 6Z"
                                            fill="currentColor"></path>
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M12 12C12 11.4477 12.4477 11 13 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H13C12.4477 13 12 12.5523 12 12Z"
                                            fill="currentColor"></path>
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M12 18C12 17.4477 12.4477 17 13 17H21C21.5523 17 22 17.4477 22 18C22 18.5523 21.5523 19 21 19H13C12.4477 19 12 18.5523 12 18Z"
                                            fill="currentColor"></path>
                                    </svg>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={buttonClass(editor.isActive("blockquote"))} aria-label="Toggle blockquote">

                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 6C8 5.44772 8.44772 5 9 5H16C16.5523 5 17 5.44772 17 6C17 6.55228 16.5523 7 16 7H9C8.44772 7 8 6.55228 8 6Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4 3C4.55228 3 5 3.44772 5 4L5 20C5 20.5523 4.55229 21 4 21C3.44772 21 3 20.5523 3 20L3 4C3 3.44772 3.44772 3 4 3Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8 12C8 11.4477 8.44772 11 9 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H9C8.44772 13 8 12.5523 8 12Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8 18C8 17.4477 8.44772 17 9 17H16C16.5523 17 17 17.4477 17 18C17 18.5523 16.5523 19 16 19H9C8.44772 19 8 18.5523 8 18Z" fill="currentColor"></path></svg>

                </button>

                <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-600" />

                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive("bold"))} aria-label="Toggle bold">
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 2.5C5.17157 2.5 4.5 3.17157 4.5 4V20C4.5 20.8284 5.17157 21.5 6 21.5H15C16.4587 21.5 17.8576 20.9205 18.8891 19.8891C19.9205 18.8576 20.5 17.4587 20.5 16C20.5 14.5413 19.9205 13.1424 18.8891 12.1109C18.6781 11.9 18.4518 11.7079 18.2128 11.5359C19.041 10.5492 19.5 9.29829 19.5 8C19.5 6.54131 18.9205 5.14236 17.8891 4.11091C16.8576 3.07946 15.4587 2.5 14 2.5H6ZM14 10.5C14.663 10.5 15.2989 10.2366 15.7678 9.76777C16.2366 9.29893 16.5 8.66304 16.5 8C16.5 7.33696 16.2366 6.70107 15.7678 6.23223C15.2989 5.76339 14.663 5.5 14 5.5H7.5V10.5H14ZM7.5 18.5V13.5H15C15.663 13.5 16.2989 13.7634 16.7678 14.2322C17.2366 14.7011 17.5 15.337 17.5 16C17.5 16.663 17.2366 17.2989 16.7678 17.7678C16.2989 18.2366 15.663 18.5 15 18.5H7.5Z" fill="currentColor"></path></svg>
                </button>
                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${buttonClass(editor.isActive("italic"))} italic`} aria-label="Toggle italic">
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15.0222 3H19C19.5523 3 20 3.44772 20 4C20 4.55228 19.5523 5 19 5H15.693L10.443 19H14C14.5523 19 15 19.4477 15 20C15 20.5523 14.5523 21 14 21H9.02418C9.00802 21.0004 8.99181 21.0004 8.97557 21H5C4.44772 21 4 20.5523 4 20C4 19.4477 4.44772 19 5 19H8.30704L13.557 5H10C9.44772 5 9 4.55228 9 4C9 3.44772 9.44772 3 10 3H14.9782C14.9928 2.99968 15.0075 2.99967 15.0222 3Z" fill="currentColor"></path></svg>
                </button>


                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${buttonClass(editor.isActive("strike"))} line-through`} aria-label="Toggle strike">
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9.00039 3H16.0001C16.5524 3 17.0001 3.44772 17.0001 4C17.0001 4.55229 16.5524 5 16.0001 5H9.00011C8.68006 4.99983 8.36412 5.07648 8.07983 5.22349C7.79555 5.37051 7.55069 5.5836 7.36585 5.84487C7.181 6.10614 7.06155 6.40796 7.01754 6.72497C6.97352 7.04198 7.00623 7.36492 7.11292 7.66667C7.29701 8.18737 7.02414 8.75872 6.50344 8.94281C5.98274 9.1269 5.4114 8.85403 5.2273 8.33333C5.01393 7.72984 4.94851 7.08396 5.03654 6.44994C5.12456 5.81592 5.36346 5.21229 5.73316 4.68974C6.10285 4.1672 6.59256 3.74101 7.16113 3.44698C7.72955 3.15303 8.36047 2.99975 9.00039 3Z" fill="currentColor"></path><path d="M18 13H20C20.5523 13 21 12.5523 21 12C21 11.4477 20.5523 11 20 11H4C3.44772 11 3 11.4477 3 12C3 12.5523 3.44772 13 4 13H14C14.7956 13 15.5587 13.3161 16.1213 13.8787C16.6839 14.4413 17 15.2044 17 16C17 16.7956 16.6839 17.5587 16.1213 18.1213C15.5587 18.6839 14.7956 19 14 19H6C5.44772 19 5 19.4477 5 20C5 20.5523 5.44772 21 6 21H14C15.3261 21 16.5979 20.4732 17.5355 19.5355C18.4732 18.5979 19 17.3261 19 16C19 14.9119 18.6453 13.8604 18 13Z" fill="currentColor"></path></svg>
                </button>

                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${buttonClass(editor.isActive("codeBlock"))} text-xs font-bold`} aria-label="Toggle code block">

                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15.4545 4.2983C15.6192 3.77115 15.3254 3.21028 14.7983 3.04554C14.2712 2.88081 13.7103 3.1746 13.5455 3.70175L8.54554 19.7017C8.38081 20.2289 8.6746 20.7898 9.20175 20.9545C9.72889 21.1192 10.2898 20.8254 10.4545 20.2983L15.4545 4.2983Z" fill="currentColor"></path><path d="M6.70711 7.29289C7.09763 7.68342 7.09763 8.31658 6.70711 8.70711L3.41421 12L6.70711 15.2929C7.09763 15.6834 7.09763 16.3166 6.70711 16.7071C6.31658 17.0976 5.68342 17.0976 5.29289 16.7071L1.29289 12.7071C0.902369 12.3166 0.902369 11.6834 1.29289 11.2929L5.29289 7.29289C5.68342 6.90237 6.31658 6.90237 6.70711 7.29289Z" fill="currentColor"></path><path d="M17.2929 7.29289C17.6834 6.90237 18.3166 6.90237 18.7071 7.29289L22.7071 11.2929C23.0976 11.6834 23.0976 12.3166 22.7071 12.7071L18.7071 16.7071C18.3166 17.0976 17.6834 17.0976 17.2929 16.7071C16.9024 16.3166 16.9024 15.6834 17.2929 15.2929L20.5858 12L17.2929 8.70711C16.9024 8.31658 16.9024 7.68342 17.2929 7.29289Z" fill="currentColor"></path></svg>
                </button>
                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${buttonClass(editor.isActive("underline"))} underline`} aria-label="Toggle underline">
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 4C7 3.44772 6.55228 3 6 3C5.44772 3 5 3.44772 5 4V10C5 11.8565 5.7375 13.637 7.05025 14.9497C8.36301 16.2625 10.1435 17 12 17C13.8565 17 15.637 16.2625 16.9497 14.9497C18.2625 13.637 19 11.8565 19 10V4C19 3.44772 18.5523 3 18 3C17.4477 3 17 3.44772 17 4V10C17 11.3261 16.4732 12.5979 15.5355 13.5355C14.5979 14.4732 13.3261 15 12 15C10.6739 15 9.40215 14.4732 8.46447 13.5355C7.52678 12.5979 7 11.3261 7 10V4ZM4 19C3.44772 19 3 19.4477 3 20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20C21 19.4477 20.5523 19 20 19H4Z" fill="currentColor"></path></svg>
                </button>

                <span className="mx-1 h-5 w-px dark:bg-gray-600" />

                <div className="document-toolbar-menu relative">
                    <button type="button" onClick={() => setHighlightMenuOpen((open) => !open)} className={buttonClass(editor.isActive("highlight"))} aria-label="Open highlight options">

                        <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.7072 4.70711C15.0977 4.31658 15.0977 3.68342 14.7072 3.29289C14.3167 2.90237 13.6835 2.90237 13.293 3.29289L8.69294 7.89286L8.68594 7.9C8.13626 8.46079 7.82837 9.21474 7.82837 10C7.82837 10.2306 7.85491 10.4584 7.90631 10.6795L2.29289 16.2929C2.10536 16.4804 2 16.7348 2 17V20C2 20.5523 2.44772 21 3 21H12C12.2652 21 12.5196 20.8946 12.7071 20.7071L15.3205 18.0937C15.5416 18.1452 15.7695 18.1717 16.0001 18.1717C16.7853 18.1717 17.5393 17.8639 18.1001 17.3142L22.7072 12.7071C23.0977 12.3166 23.0977 11.6834 22.7072 11.2929C22.3167 10.9024 21.6835 10.9024 21.293 11.2929L16.6971 15.8887C16.5105 16.0702 16.2605 16.1717 16.0001 16.1717C15.7397 16.1717 15.4897 16.0702 15.303 15.8887L10.1113 10.697C9.92992 10.5104 9.82837 10.2604 9.82837 10C9.82837 9.73963 9.92992 9.48958 10.1113 9.30297L14.7072 4.70711ZM13.5858 17L9.00004 12.4142L4 17.4142V19H11.5858L13.5858 17Z" fill="currentColor"></path></svg>

                    </button>

                    {highlightMenuOpen && (
                        <div className="absolute left-0 top-10 z-10 flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-2 py-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-900/90">
                            {HIGHLIGHT_COLORS.map((color) => (
                                <button key={color.name} type="button" onClick={() => { editor.chain().focus().setMark("highlight", { color: color.value }).run(); closeMenus(); }} className="h-6 w-6 rounded-full border-2 border-transparent hover:scale-105" style={{ backgroundColor: color.value }} aria-label={`Highlight ${color.name}`} title={`Highlight ${color.name}`} />
                            ))}
                            <button type="button" onClick={() => { editor.chain().focus().unsetMark("highlight").run(); closeMenus(); }} className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500" aria-label="Remove highlight">×</button>
                        </div>
                    )}
                </div>


                <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-600" />

                <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} className={`${buttonClass(editor.isActive("superscript"))} text-xs font-bold`} aria-label="Toggle superscript">

                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.7071 7.29289C13.0976 7.68342 13.0976 8.31658 12.7071 8.70711L4.70711 16.7071C4.31658 17.0976 3.68342 17.0976 3.29289 16.7071C2.90237 16.3166 2.90237 15.6834 3.29289 15.2929L11.2929 7.29289C11.6834 6.90237 12.3166 6.90237 12.7071 7.29289Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M3.29289 7.29289C3.68342 6.90237 4.31658 6.90237 4.70711 7.29289L12.7071 15.2929C13.0976 15.6834 13.0976 16.3166 12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L3.29289 8.70711C2.90237 8.31658 2.90237 7.68342 3.29289 7.29289Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M17.405 1.40657C18.0246 1.05456 18.7463 0.92634 19.4492 1.04344C20.1521 1.16054 20.7933 1.51583 21.2652 2.0497L21.2697 2.05469L21.2696 2.05471C21.7431 2.5975 22 3.28922 22 4.00203C22 5.08579 21.3952 5.84326 20.7727 6.34289C20.1966 6.80531 19.4941 7.13675 18.9941 7.37261C18.9714 7.38332 18.9491 7.39383 18.9273 7.40415C18.4487 7.63034 18.2814 7.78152 18.1927 7.91844C18.1778 7.94155 18.1625 7.96834 18.1473 8.00003H21C21.5523 8.00003 22 8.44774 22 9.00003C22 9.55231 21.5523 10 21 10H17C16.4477 10 16 9.55231 16 9.00003C16 8.17007 16.1183 7.44255 16.5138 6.83161C16.9107 6.21854 17.4934 5.86971 18.0728 5.59591C18.6281 5.33347 19.1376 5.09075 19.5208 4.78316C19.8838 4.49179 20 4.25026 20 4.00203C20 3.77192 19.9178 3.54865 19.7646 3.37182C19.5968 3.18324 19.3696 3.05774 19.1205 3.01625C18.8705 2.97459 18.6137 3.02017 18.3933 3.14533C18.1762 3.26898 18.0191 3.45826 17.9406 3.67557C17.7531 4.19504 17.18 4.46414 16.6605 4.27662C16.141 4.0891 15.8719 3.51596 16.0594 2.99649C16.303 2.3219 16.7817 1.76125 17.4045 1.40689L17.405 1.40657Z" fill="currentColor"></path></svg>
                </button>
                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} className={`${buttonClass(editor.isActive("subscript"))} text-xs font-bold`} aria-label="Toggle subscript">
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.29289 7.29289C3.68342 6.90237 4.31658 6.90237 4.70711 7.29289L12.7071 15.2929C13.0976 15.6834 13.0976 16.3166 12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L3.29289 8.70711C2.90237 8.31658 2.90237 7.68342 3.29289 7.29289Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.7071 7.29289C13.0976 7.68342 13.0976 8.31658 12.7071 8.70711L4.70711 16.7071C4.31658 17.0976 3.68342 17.0976 3.29289 16.7071C2.90237 16.3166 2.90237 15.6834 3.29289 15.2929L11.2929 7.29289C11.6834 6.90237 12.3166 6.90237 12.7071 7.29289Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M17.4079 14.3995C18.0284 14.0487 18.7506 13.9217 19.4536 14.0397C20.1566 14.1578 20.7977 14.5138 21.2696 15.0481L21.2779 15.0574L21.2778 15.0575C21.7439 15.5988 22 16.2903 22 17C22 18.0823 21.3962 18.8401 20.7744 19.3404C20.194 19.8073 19.4858 20.141 18.9828 20.378C18.9638 20.387 18.9451 20.3958 18.9266 20.4045C18.4473 20.6306 18.2804 20.7817 18.1922 20.918C18.1773 20.9412 18.1619 20.9681 18.1467 21H21C21.5523 21 22 21.4477 22 22C22 22.5523 21.5523 23 21 23H17C16.4477 23 16 22.5523 16 22C16 21.1708 16.1176 20.4431 16.5128 19.832C16.9096 19.2184 17.4928 18.8695 18.0734 18.5956C18.6279 18.334 19.138 18.0901 19.5207 17.7821C19.8838 17.49 20 17.2477 20 17C20 16.7718 19.9176 16.5452 19.7663 16.3672C19.5983 16.1792 19.3712 16.0539 19.1224 16.0121C18.8722 15.9701 18.6152 16.015 18.3942 16.1394C18.1794 16.2628 18.0205 16.4549 17.9422 16.675C17.7572 17.1954 17.1854 17.4673 16.665 17.2822C16.1446 17.0972 15.8728 16.5254 16.0578 16.005C16.2993 15.3259 16.7797 14.7584 17.4039 14.4018L17.4079 14.3995L17.4079 14.3995Z" fill="currentColor"></path></svg>
                </button>

                <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-600" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition ${editor.isActive({ textAlign: "left" })
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"}
          `}
                    aria-label="Align left"
                    title="Align left"
                >
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 6C2 5.44772 2.44772 5 3 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H3C2.44772 7 2 6.55228 2 6Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 11.4477 2.44772 11 3 11H15C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13H3C2.44772 13 2 12.5523 2 12Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 18C2 17.4477 2.44772 17 3 17H17C17.5523 17 18 17.4477 18 18C18 18.5523 17.5523 19 17 19H3C2.44772 19 2 18.5523 2 18Z" fill="currentColor"></path></svg>
                </button>
                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition ${editor.isActive({ textAlign: "center" })
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"}
          `}
                    aria-label="Align center"
                    title="Align center"
                >
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 6C2 5.44772 2.44772 5 3 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H3C2.44772 7 2 6.55228 2 6Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6 12C6 11.4477 6.44772 11 7 11H17C17.5523 11 18 11.4477 18 12C18 12.5523 17.5523 13 17 13H7C6.44772 13 6 12.5523 6 12Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4 18C4 17.4477 4.44772 17 5 17H19C19.5523 17 20 17.4477 20 18C20 18.5523 19.5523 19 19 19H5C4.44772 19 4 18.5523 4 18Z" fill="currentColor"></path></svg>
                </button>
                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition ${editor.isActive({ textAlign: "right" })
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"}
          `}
                    aria-label="Align right"
                    title="Align right"
                >
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 6C2 5.44772 2.44772 5 3 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H3C2.44772 7 2 6.55228 2 6Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8 12C8 11.4477 8.44772 11 9 11H19C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13H9C8.44772 13 8 12.5523 8 12Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4 18C4 17.4477 4.44772 17 5 17H19C19.5523 17 20 17.4477 20 18C20 18.5523 19.5523 19 19 19H5C4.44772 19 4 18.5523 4 18Z" fill="currentColor"></path></svg>
                </button>
                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition ${editor.isActive({ textAlign: "justify" })
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"}
          `}
                    aria-label="Align justify"
                    title="Align justify"
                >
                    <svg width="24" height="24" className="tiptap-button-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 6C2 5.44772 2.44772 5 3 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H3C2.44772 7 2 6.55228 2 6Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 11.4477 2.44772 11 3 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H3C2.44772 13 2 12.5523 2 12Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4 18C4 17.4477 4.44772 17 5 17H19C19.5523 17 20 17.4477 20 18C20 18.5523 19.5523 19 19 19H5C4.44772 19 4 18.5523 4 18Z" fill="currentColor"></path></svg>
                </button>

                <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-600" />
                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    Paper
                    <select
                        value={paperSize}
                        onChange={(event) => onPaperSizeChange(event.target.value as PaperSize)}
                        className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                        {Object.entries(PAPER_SIZES).map(([value, size]) => (
                            <option key={value} value={value}>{size.label}</option>
                        ))}
                    </select>
                </label>
                <span className="mx-1 h-5 w-px dark:bg-gray-600" />
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    Pages
                    <input
                        type="number"
                        min={1}
                        max={50}
                        value={pageCount}
                        onChange={(event) => onPageCountChange(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
                        className="h-8 w-16 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    />
                </label>
            </div>
        </>
    );
}
