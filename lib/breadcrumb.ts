declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    breadcrumb?:
      | string
      | ((match: {
          params: Record<string, string>
          loaderData: unknown
        }) => string | undefined)
  }
}

export {}
