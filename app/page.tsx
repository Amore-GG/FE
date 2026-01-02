"use client"

import { useState } from "react"
import BrandScenarioSetup from "@/components/brand-scenario-setup"
import TimelineStoryboard from "@/components/timeline-storyboard"
import VideoGenerator from "@/components/video-generator"

export type BrandScenarioData = {
  brandName: string
  brandConcept?: string
  productImage?: string
  userPrompt?: string
  scenario?: string
}

export type TimelineItem = {
  index: number
  timestamp: string
  timeStart: number
  timeEnd: number
  scene: string              // scene_description
  action: string             // character_pose_and_gaze
  dialogue: string
  backgroundSoundsPrompt?: string
  t2iPrompt?: {
    background: string
    characterPoseAndGaze: string
    product: string
    cameraAngle: string
  }
  imageEditPrompt?: {
    poseChange: string
    gazeChange: string
    expression: string
    additionalEdits: string
  }
  gigiImage?: string
  hairReference?: string
  outfitReference?: string
  voiceType?: "narration" | "gigi"
}

export type StoryboardData = {
  timeline: TimelineItem[]
  voiceSettings: VoiceData
}

export type VoiceData = {
  text: string
  language: string
  emotion: string
  speed: number
  pitch: number
  cloneVoiceFile?: string
}

export default function Page() {
  const [currentStep, setCurrentStep] = useState(1)
  const [brandScenarioData, setBrandScenarioData] = useState<BrandScenarioData | null>(null)
  const [storyboardData, setStoryboardData] = useState<StoryboardData | null>(null)

  return (
    <main className="min-h-screen">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 right-0 bg-card border-b border-border z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">GIGI</div>
              <div className="text-xs text-muted-foreground">by AMOREPACIFIC</div>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep === step
                        ? "bg-primary text-primary-foreground"
                        : currentStep > step
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && <div className={`w-12 h-0.5 ${currentStep > step ? "bg-accent" : "bg-border"}`} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-12">
        {currentStep === 1 && (
          <BrandScenarioSetup
            onNext={(data) => {
              setBrandScenarioData(data)
              setCurrentStep(2)
            }}
          />
        )}

        {currentStep === 2 && (
          <TimelineStoryboard
            brandScenarioData={brandScenarioData}
            onBack={() => setCurrentStep(1)}
            onNext={(data) => {
              setStoryboardData(data)
              setCurrentStep(3)
            }}
          />
        )}

        {/* Step 3: Video Generation (unchanged) */}
        {currentStep === 3 && (
          <VideoGenerator
            brandScenarioData={brandScenarioData}
            storyboardData={storyboardData}
            onBack={() => setCurrentStep(2)}
          />
        )}
      </div>
    </main>
  )
}
