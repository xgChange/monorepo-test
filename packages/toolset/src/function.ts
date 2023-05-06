type CommonFnType = (...args: any[]) => any

type HandlerType = Partial<{
  successedHandling: CommonFnType
  errorHandling: CommonFnType
  finishedHandling: CommonFnType
}>

export const callWithErrorAsyncHandling = async <T extends CommonFnType>(
  fn: T,
  handler: HandlerType | null,
  ...args: Parameters<T>
) => {
  let res: ReturnType<T> | undefined = undefined
  try {
    res = await fn(...args)
    handler?.successedHandling?.(res)
    return res
  } catch (error) {
    if (handler?.errorHandling) {
      handler?.errorHandling?.(error)
    } else {
      throw error
    }
  } finally {
    handler?.finishedHandling?.()
  }
}

export function getMsg(msg: string) {
  return msg
}