"use client";

export default function ConfirmForm({ action, confirmText, children, className, style }) {
  return (
    <form
      action={action}
      className={className}
      style={style}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
