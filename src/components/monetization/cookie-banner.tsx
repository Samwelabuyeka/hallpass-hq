import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Cookie, X } from "lucide-react"

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)
    
    // Initialize Google Analytics or other tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
  }

  const rejectCookies = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="shadow-elegant">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-2">Cookie Consent</h4>
              <p className="text-xs text-muted-foreground mb-3">
                We use cookies to enhance your experience and support our platform. 
                By continuing, you agree to our cookie policy.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={acceptCookies}
                  className="text-xs"
                >
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={rejectCookies}
                  className="text-xs"
                >
                  Reject
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={rejectCookies}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}