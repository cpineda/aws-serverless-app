import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Amplify } from 'aws-amplify'
import awsmobile from '@/aws-exports'

Amplify.configure(awsmobile)

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
