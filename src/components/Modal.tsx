import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "fullscreen";

const sizeClasses: Record<ModalSize, string> = {
    sm: "w-[92vw] max-w-[420px]",
    md: "w-[94vw] max-w-[720px]",
    lg: "w-[94vw] max-w-[960px]",
    xl: "w-[96vw] max-w-[1200px]",
    fullscreen: "w-screen h-screen max-w-none max-h-none rounded-none p-0 overflow-hidden",
};

const Modal = ({
                   children,
                   handleCloseModal,
                   size = "lg",
               }: {
    children: ReactNode;
    handleCloseModal: () => void;
    size?: ModalSize;
}) => {
    const panelBase =
        size === "fullscreen"
            ? "relative z-10 bg-[#141414]"
            : "relative z-10 bg-[#141414] rounded-2xl p-6 sm:p-8 max-h-[92dvh] overflow-y-auto";

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <button
                className="fixed inset-0 bg-black/50 hover:cursor-pointer"
                onClick={handleCloseModal}
                aria-label="Close modal"
            />

            {/* Panel */}
            <div className={`${panelBase} ${sizeClasses[size]}`}>
                {children}
            </div>
        </div>,
        document.getElementById("portal")!
    );
};

export default Modal;
