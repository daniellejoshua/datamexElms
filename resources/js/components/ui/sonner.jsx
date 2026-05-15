"use client";
import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          [data-sonner-toast][data-type="success"] {
            background: rgba(240, 253, 244, 0.95) !important;
            color: #166534 !important;
            border: 1px solid #bbf7d0 !important;
          }
          [data-sonner-toast][data-type="error"] {
            background: rgba(254, 242, 242, 0.95) !important;
            color: #991b1b !important;
            border: 1px solid #fecaca !important;
          }
          [data-sonner-toast][data-type="warning"] {
            background: rgba(255, 251, 235, 0.95) !important;
            color: #92400e !important;
            border: 1px solid #fde68a !important;
          }
          [data-sonner-toast][data-type="info"] {
            background: rgba(239, 246, 255, 0.95) !important;
            color: #1e40af !important;
            border: 1px solid #bfdbfe !important;
          }
        `
      }} />
      <Sonner
        theme="light"
        className="toaster group"
        position="top-right"
        swipeToDismiss={false}
        icons={{
          success: <CircleCheck className="h-4 w-4 text-green-600" />,
          info: <Info className="h-4 w-4 text-blue-600" />,
          warning: <TriangleAlert className="h-4 w-4 text-yellow-600" />,
          error: <OctagonX className="h-4 w-4 text-red-600" />,
          loading: <LoaderCircle className="h-4 w-4 animate-spin text-gray-600" />,
        }}
        toastOptions={{
          style: {
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            backdropFilter: 'blur(8px)',
          },
          classNames: {
            title: 'text-sm font-semibold',
            description: 'text-sm opacity-90',
            actionButton: 'bg-zinc-900 text-white px-3 py-1.5 rounded text-sm font-medium',
            cancelButton: 'bg-zinc-100 text-zinc-900 px-3 py-1.5 rounded text-sm font-medium',
          },
        }}
        {...props} 
      />
    </>
  );
}

export { Toaster }
