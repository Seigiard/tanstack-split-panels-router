import { Link } from '@/components/ui/link'

// Valid routes compile without errors
;<Link to='/' />
;<Link to='/users' />
;<Link to='/users/$userId' params={{ userId: '1' }} />

// Passes standard Link props
;<Link to='/' className='foo' />
;<Link to='/' preload='intent' />
;<Link to='/'>Children</Link>

// search is NOT required (wrapper always clears it)
;<Link to='/users' />

// @ts-expect-error — unknown route path
;<Link to='/nonexistent' />

// @ts-expect-error — wrong param name for /users/$userId
;<Link to='/users/$userId' params={{ wrongParam: '1' }} />
