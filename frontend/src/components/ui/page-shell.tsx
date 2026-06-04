import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: "default" | "narrow" | "wide";
};

export function PageShell({ children, maxWidth = "default" }: PageShellProps) {
  const widthClass = {
    default: "max-w-[1500px]",
    narrow: "max-w-4xl",
    wide: "max-w-[1600px]",
  }[maxWidth];

  return (
    <div
      className={`mx-auto w-full ${widthClass} px-5 py-8 pt-20 sm:px-6 lg:px-8 lg:pt-8 xl:px-10`}
    >
      {children}
    </div>
  );
}
