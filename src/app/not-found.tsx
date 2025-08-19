
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Frown } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
      <Frown className="w-24 h-24 mb-4 text-primary" />
      <h1 className="text-4xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-6">Oops! The page you are looking for does not exist.</p>
      <Button asChild>
        <Link href="/">Go Back Home</Link>
      </Button>
    </div>
  )
}
