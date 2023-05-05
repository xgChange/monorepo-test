import { callWithErrorAsyncHandling } from 'mn-utils'

async function TestAsyncFn() {
  return 'hello testasyncfn'
}

export async function main() {
  const result = await callWithErrorAsyncHandling(TestAsyncFn, null)
  console.log('main', result)
}

main()