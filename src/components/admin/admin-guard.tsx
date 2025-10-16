import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"
import { Shield, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/')
        return
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (!profile || !profile.is_admin) {
          setIsAdmin(false)
        } else {
          setIsAdmin(true)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-semibold mb-2">Access Denied</h3>
            <p className="mb-4">
              You do not have administrator privileges to access this page.
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-sm underline hover:no-underline"
            >
              Return to Dashboard
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}
