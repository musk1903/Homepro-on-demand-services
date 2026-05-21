import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '16px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        },
      }}
    />
  );
}

