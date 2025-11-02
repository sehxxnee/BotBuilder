import { TRPCProvider } from '@/app/trpc/Provider'; 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <TRPCProvider>  
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}