import React from 'react';
import { X } from 'lucide-react';
import toast, { Toast } from 'react-hot-toast';

interface DismissibleToastProps {
  t: Toast;
  message: string;
}

export const DismissibleToast: React.FC<DismissibleToastProps> = ({ t, message }) => {
  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-card/95 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-border/30 backdrop-blur-sm`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-card-foreground">{message}</p>
          </div>
        </div>
      </div>
      <div className="flex">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border-l border-border/30 rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const showDismissibleToast = (message: string) => {
  toast.custom(t => <DismissibleToast t={t} message={message} />, {
    duration: Infinity,
    position: 'top-right',
  });
};
