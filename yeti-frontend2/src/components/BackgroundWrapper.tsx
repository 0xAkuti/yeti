interface BackgroundWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function BackgroundWrapper({ children, className = '' }: BackgroundWrapperProps) {
  return (
    <div className={`min-h-screen custom-bg relative ${className}`}>
      {children}
    </div>
  );
}