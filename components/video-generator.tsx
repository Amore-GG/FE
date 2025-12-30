"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Video, Download, Sparkles, Clock, SkipForward } from "lucide-react"
import type { BrandScenarioData, StoryboardData } from "@/app/page"

type Props = {
  brandScenarioData: BrandScenarioData | null
  storyboardData: StoryboardData | null
  onBack: () => void
}

export default function VideoGenerator({ brandScenarioData, storyboardData, onBack }: Props) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 500)

    await new Promise((resolve) => setTimeout(resolve, 5500))

    setGeneratedVideo(
      `/placeholder.svg?height=720&width=1280&query=AI influencer Gigi video for ${brandScenarioData?.brandName}`,
    )
    setIsGenerating(false)
  }

  const handleComplete = () => {
    alert("워크플로우가 완료되었습니다!")
  }

  const voiceData = storyboardData?.voiceSettings

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">비디오 생성</h1>
        <p className="text-muted-foreground text-lg">타임라인과 음성을 조합하여 최종 비디오를 생성합니다</p>
      </div>

      <div className="space-y-8">
        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-6">생성 정보</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">브랜드</div>
                <div className="text-base font-medium">{brandScenarioData?.brandName}</div>
              </div>

              {brandScenarioData?.productImage && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">제품 사진</div>
                  <img
                    src={brandScenarioData.productImage || "/placeholder.svg"}
                    alt="Product"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">타임라인</div>
              <div className="space-y-2">
                {storyboardData?.timeline.slice(0, 3).map((item, index) => (
                  <div key={index} className="bg-muted/30 rounded p-2 text-xs">
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <Clock className="h-3 w-3" />
                      {item.timestamp}
                    </div>
                    <div className="text-muted-foreground truncate">{item.scene}</div>
                  </div>
                ))}
                {storyboardData && storyboardData.timeline.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{storyboardData.timeline.length - 3}개 더...
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">음성 설정</div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">언어:</span>{" "}
                  <span className="font-medium">
                    {voiceData?.language === "ko" ? "한국어" : voiceData?.language === "en" ? "영어" : "일본어"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">감정:</span>{" "}
                  <span className="font-medium">{voiceData?.emotion === "cheerful" ? "밝고 활기찬" : "차분함"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">속도:</span>{" "}
                  <span className="font-medium">{voiceData?.speed.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center mb-6">
            {generatedVideo ? (
              <div className="relative w-full h-full">
                <img
                  src={generatedVideo || "/placeholder.svg"}
                  alt="Generated video"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/90 rounded-full p-6">
                    <Video className="w-12 h-12 text-primary" />
                  </div>
                </div>
              </div>
            ) : isGenerating ? (
              <div className="text-center space-y-4 p-8">
                <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <div className="space-y-2">
                  <div className="text-lg font-medium">비디오 생성 중...</div>
                  <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mx-auto mt-4">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-sm font-medium text-primary">{progress}%</div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">생성하기 버튼을 눌러 최종 비디오를 만들어보세요</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
              <ChevronLeft className="mr-2 h-4 w-4" />
              이전
            </Button>

            {!generatedVideo ? (
              <>
                <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1" size="lg">
                  {isGenerating ? (
                    "생성 중..."
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      비디오 생성하기
                    </>
                  )}
                </Button>
                {!isGenerating && (
                  <Button onClick={handleComplete} variant="outline" className="flex-1 bg-transparent">
                    <SkipForward className="mr-2 h-4 w-4" />
                    건너뛰기
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={handleGenerate} variant="outline" className="flex-1 bg-transparent">
                  다시 생성
                </Button>
                <Button className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
