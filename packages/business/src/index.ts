import { callWithErrorAsyncHandling } from 'mn-toolset'

async function myFn() {
  return '我是 business'
}

async function main() {
  return await callWithErrorAsyncHandling(myFn, {})
}
main()