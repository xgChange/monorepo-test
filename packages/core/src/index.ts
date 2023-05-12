import { callWithErrorAsyncHandling } from 'mn-toolset'
import type { CommonFnType } from 'mn-toolset'

export const coreName: string = '我是coreName'

const TestAsyncFn: CommonFnType = async () => {
  return 'hello test async fn'
}

export async function main() {
  const result = await callWithErrorAsyncHandling(TestAsyncFn, null)
  console.log('main', coreName, result)
}

// main()
