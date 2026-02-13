import {
  Link as TanStackLink,
  type LinkComponent,
} from '@tanstack/react-router'

export const Link: LinkComponent<'a'> = (props) => (
  <TanStackLink
    {...(props as any)}
    search={{ left: undefined, right: undefined }}
  />
)
