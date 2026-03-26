import { useToastContext } from '../context/ToastContext';

export const useToast = () => {
  const { toasts, showToast, removeToast } = useToastContext();
  return { toasts, showToast, removeToast };
};
