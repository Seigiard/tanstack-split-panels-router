export type User = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  image: string
  address: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  age: number
  username: string
  company: { name: string; title: string }
}

export type Category = {
  slug: string
  name: string
  url: string
}

export type Product = {
  id: number
  title: string
  description: string
  price: number
  thumbnail: string
  category: string
  rating: number
  brand: string
}

export type Post = {
  id: number
  title: string
  body: string
  userId: number
  tags: string[]
}

export type Comment = {
  id: number
  body: string
  postId: number
  user: { id: number; username: string; fullName: string }
}

export type PaginatedResponse<T> = {
  total: number
  skip: number
  limit: number
} & Record<string, T[] | number>
