# umami-analytics-next

A simple type-safe integration between the Umami Analytics API, loaded using [Next's Script](https://nextjs.org/docs/pages/api-reference/components/script) component.

## Installation

```sh
npm install umami-analytics-next
```

## Usage

The package exposes a `umamiAnalyticsContextFactory` function that accepts a list of events to track (with the possibility of typing the event data), and returns the Providers and hooks for you to use.

```tsx
import { umamiAnalyticsContextFactory } from 'umami-analytics-next'

const events = ['buy', 'cancel', 'gift', 'sell', 'signup', 'view'] as const

type Events = typeof events
type Event = Events[number]

// add a custom type for each custom event data you want to add type-safe
type SignUpEventData = {
  receiveUpdates: boolean
}
type OperationsEventData = {
  amountItems: number
  success: boolean
  couponCode?: string
}

type SignUpEvents = Extract<Event, 'signup'>
type OperationsEvents = Extract<Event, 'buy' | 'cancel' | 'gift' | 'sell'>

type AllEventsWithData = OperationsEvents | SignUpEvents

// Map each type with the corresponding event data
type EventDataMap = {
  [K in AllEventsWithData]: K extends SignUpEvents
    ? SignUpEventData
    : K extends OperationsEvents
      ? OperationsEventData
      : // be flexible with untyped events
        { [key: string]: unknown }
}

// Generic types are optional, but type-safety will be missing
const { UmamiAnalyticsContext, UmamiAnalyticsProvider, useUmami } =
  umamiAnalyticsContextFactory<Events, EventDataMap>(
    eventNames,
  )

  // Then, inn your _app.tsx or layout component:
  <UmamiAnalyticsProvider
    autoTrack={false} // defaults to true
    processUrl={removeLocaleAndTrailingSlash}
    src="script-url"
    websiteId="website-id-provided-by-umami"
  >
    {children}
  </UmamiAnalyticsProvider>

  // and in any component that can consume this context:

  const { track } = useUmami()
  // Tracks a pageView - only needed if autoTrack is set to false
  track()
  // track has type-safe autocompletion in both the event name and the data
  // The event data is optional, but if provided, it must match the type of the event
  track('buy', {
    amountItems: 3,
    couponCode: 'C2024',
    success: true
  })
  track('signup', {
    receiveUpdates: true
  })
  // Umami allows for custom events or using a callback. Here, the default typing provided by Umami is used
  track({ customPayload: '123', website: '/form' })
  // Umami allows to use a function that keeps the original payload, and allows you to update what you want
  track((params) => ({ ...params, website: '/form' }))
```

## API

### umamiAnalyticsContextFactory(events, options?)

Returns an object with `UmamiAnalyticsContext`, `UmamiAnalyticsProvider`, `useUmami`.

#### events

Type: `string[]`

The array of events. For type-safety, it must be a [const assertion](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions) array.

### UmamiAnalyticsProvider

The React provider. It accepts the following properties:

#### autoTrack?

Type: `boolean`
Default: `true`

Whether to use the autotrack feature from Umami or not.

#### domains?

Type: `string[]`
Default: `undefined`

A list of domains in which the tracker will run.

The properties accepted are:

#### processUrl?

Type: `function`
Default: `undefined`

A function which receives the pathname and returns the processed URL. Useful for removing locale prefixes or trailing slashes.

#### src

Type: `string`

The URL of the script to load.

#### websiteId

Type: `string`

The umami website ID.

### UmamiAnalyticsContext

The React context. It must be read with [React's useContext](https://react.dev/reference/react/useContext). It reads all values given to the Provider, plus the value `loaded`

#### loaded

Type: `boolean`

Whether the script has been loaded or not.

### useUmami

A custom hook which returns an object with the property `track`, which is undefined until `loaded` is true in the context

#### track

Type: `function`

It uses the same API as [umami tracker functions](https://umami.is/docs/tracker-functions), but with the type-safety from the event names and event data.
