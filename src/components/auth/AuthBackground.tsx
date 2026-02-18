export const AuthBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-linear-to-tr from-sky-100 via-white to-blue-50 flex items-center justify-center p-4">
      {/* 装飾用の光の輪 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-200/30 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]" />
      
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
};