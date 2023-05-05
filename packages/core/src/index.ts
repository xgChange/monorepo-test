import { callWithErrorAsyncHandling } from 'mn-toolset'

async function TestAsyncFn() {
  return 'hello test async fn'
}

export async function main() {
  const result = await callWithErrorAsyncHandling(TestAsyncFn, null)
  console.log('main', result)
}

// main()