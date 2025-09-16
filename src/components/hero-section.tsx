"use client"

import { motion } from "framer-motion"
import { Upload, Calendar, BookOpen, Trophy, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Upload,
    title: "Easy Upload",
    description: "Upload your timetable in Excel or CSV format with just a few clicks"
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Automatically organize and filter your classes by units, days, and times"
  },
  {
    icon: BookOpen,
    title: "Unit Management",
    description: "Keep track of all your subjects and courses in one organized place"
  },
  {
    icon: Trophy,
    title: "Exam Ready",
    description: "Never miss an exam with our comprehensive examination timetable system"
  }
]

export function HeroSection() {
  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/5 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-8">
          {/* Main Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">
              MyStudent
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Your complete academic companion. Upload, organize, and manage your 
              timetables with intelligent filtering and beautiful scheduling tools.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shadow-elegant px-8 py-6 text-lg font-semibold group"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 px-8 py-6 text-lg backdrop-blur"
            >
              View Demo
            </Button>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-smooth shadow-soft">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}