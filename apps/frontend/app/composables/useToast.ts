export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

let nextToastId = 0

export const useToast = () => {
  const toasts = useState<Toast[]>('eyuran_toasts', () => [])

  const remove = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const show = (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = ++nextToastId
    toasts.value.push({ id, message, type })
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
    return id
  }

  const success = (msg: string, duration = 4000) => show(msg, 'success', duration)
  const error = (msg: string, duration = 4500) => show(msg, 'error', duration)
  const info = (msg: string, duration = 4000) => show(msg, 'info', duration)
  const warning = (msg: string, duration = 4500) => show(msg, 'warning', duration)

  return {
    toasts,
    show,
    remove,
    success,
    error,
    info,
    warning,
  }
}
