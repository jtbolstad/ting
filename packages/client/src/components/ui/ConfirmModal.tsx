import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type ConfirmFn = (message: string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [state, setState] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const resolveRef = useRef<(v: boolean) => void>(() => {});

  const confirm: ConfirmFn = (message) =>
    new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, message });
    });

  const handleConfirm = () => {
    setState({ open: false, message: "" });
    resolveRef.current(true);
  };

  const handleCancel = () => {
    setState({ open: false, message: "" });
    resolveRef.current(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <p className="text-gray-800 mb-6">{state.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
