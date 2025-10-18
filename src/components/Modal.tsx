import { createPortal } from "react-dom";
import type { ReactNode } from "react";

const Modal = ({ children, handleCloseModal }: { children: ReactNode; handleCloseModal: () => void }) => {

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <button
                className="fixed inset-0 bg-black/50 hover:cursor-pointer"
                onClick={handleCloseModal}
            />

            {/* Panel (responsive) */}
            <div
                className="
          relative z-10
          w-[92vw] max-w-[420px]
          max-h-[90dvh] overflow-y-auto
          rounded-2xl
          p-6 sm:p-8
        "
            >
                {children}
            </div>
        </div>,
        document.getElementById("portal")!
    );
};

export default Modal;
