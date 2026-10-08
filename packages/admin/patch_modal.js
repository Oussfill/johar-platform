const fs = require("fs");
const file = "src/components/Modal.tsx";
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, "utf-8");
  if (!content.includes("useEffect")) {
    content = content.replace(
      "export default function Modal({ isOpen, onClose, title, children }: ModalProps) {",
      "import { useEffect, useRef } from 'react';\n\nexport default function Modal({ isOpen, onClose, title, children }: ModalProps) {\n  const modalRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    const handleEsc = (e: KeyboardEvent) => {\n      if (e.key === 'Escape') onClose();\n    };\n    if (isOpen) {\n      window.addEventListener('keydown', handleEsc);\n      // Auto-focus first input\n      setTimeout(() => {\n        const firstInput = modalRef.current?.querySelector('input, textarea, select') as HTMLElement;\n        if (firstInput) firstInput.focus();\n      }, 100);\n    }\n    return () => window.removeEventListener('keydown', handleEsc);\n  }, [isOpen, onClose]);"
    );
    content = content.replace(
      /<div className="bg-johar-black-light w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative">/,
      `<div ref={modalRef} className="bg-johar-black-light w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">`
    );
    fs.writeFileSync(file, content, "utf-8");
  }
}
