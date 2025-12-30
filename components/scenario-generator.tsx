"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ChevronLeft, Sparkles, Clock, RefreshCw, Upload, X, ImageIcon, Volume2, Play } from "lucide-react"
import type { StyleData, ScenarioData, TimelineItem } from "@/app/page"

type Props = {
  styleData: StyleData | null
  onBack: () => void
  onNext: (data: ScenarioData) => void
}

export default function ScenarioGenerator({ styleData, onBack, onNext }: Props) {
  const [scenario, setScenario] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false)
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false)
  const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null)
  const [userPrompt, setUserPrompt] = useState("")
  const [productImage, setProductImage] = useState<string | null>(null)
  const productInputRef = useRef<HTMLInputElement>(null)

  const [language, setLanguage] = useState("ko")
  const [emotion, setEmotion] = useState("cheerful")
  const [speed, setSpeed] = useState([1.0])
  const [pitch, setPitch] = useState([1.0])
  const [cloneVoiceFile, setCloneVoiceFile] = useState<string | null>(null)
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null)
  const voiceCloneInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProductImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVoiceCloneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCloneVoiceFile(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateScenario = async () => {
    setIsGeneratingScenario(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const generatedScenario = userPrompt
      ? `${userPrompt}\n\n${styleData?.brandName}의 톤앤매너를 반영하여 지지가 ${userPrompt}를 자연스럽게 전달합니다. 
제품의 주요 특징과 혜택을 강조하면서, 시청자들과 친근하게 소통합니다.
마지막에는 브랜드의 핵심 메시지를 전달하며 따뜻한 미소로 마무리합니다.`
      : `${styleData?.brandName}의 신제품을 소개하는 지지의 모습으로 시작됩니다. 
지지는 화면을 향해 환하게 웃으며 제품을 자연스럽게 소개합니다. 
제품의 주요 특징과 혜택을 강조하면서, 시청자들과 친근하게 소통합니다.
마지막에는 브랜드의 핵심 메시지를 전달하며 따뜻한 미소로 마무리합니다.`

    setScenario(generatedScenario)
    setIsGeneratingScenario(false)
  }

  const handleRegenerateScenario = async () => {
    setScenario(null)
    setTimeline([])
    await handleGenerateScenario()
  }

  const handleGenerateTimeline = async () => {
    setIsGeneratingTimeline(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const generatedTimeline: TimelineItem[] = [
      {
        timestamp: "0:00 - 0:05",
        scene: "오프닝: 지지가 화면에 등장하며 밝게 인사",
        dialogue: "안녕하세요! 여러분의 뷰티 파트너, 지지입니다.",
        gigiImage: "/smiling-ai-influencer-greeting.jpg",
      },
      {
        timestamp: "0:05 - 0:10",
        scene: `제품 소개: ${styleData?.brandName} 신제품을 손에 들고 소개`,
        dialogue: `오늘은 ${styleData?.brandName}의 특별한 신제품을 소개해드릴게요.`,
        gigiImage: "/ai-influencer-holding-beauty-product.jpg",
      },
      {
        timestamp: "0:10 - 0:15",
        scene: "제품 특징 강조: 제품의 주요 성분과 효과를 설명",
        dialogue: "피부에 깊은 수분을 전달하고, 자연스러운 광채를 선사합니다.",
        gigiImage: "/ai-influencer-explaining-product-benefits.jpg",
      },
      {
        timestamp: "0:15 - 0:20",
        scene: "사용법 시연: 제품 사용 방법을 보여줌",
        dialogue: "이렇게 부드럽게 펴 발라주시면 됩니다.",
        gigiImage: "/ai-influencer-demonstrating-product-application.jpg",
      },
      {
        timestamp: "0:20 - 0:25",
        scene: "효과 강조: 사용 후 피부의 변화를 설명",
        dialogue: "즉각적으로 촉촉하고 생기있는 피부를 느끼실 수 있어요.",
        gigiImage: "/ai-influencer-showing-glowing-skin.jpg",
      },
      {
        timestamp: "0:25 - 0:30",
        scene: "클로징: 따뜻한 미소로 시청자들에게 인사",
        dialogue: "여러분의 아름다움을 응원합니다. 감사합니다!",
        gigiImage: "/ai-influencer-waving-goodbye-with-smile.jpg",
      },
    ]

    setTimeline(generatedTimeline)
    setIsGeneratingTimeline(false)
  }

  const handleRegenerateTimelineImage = async (index: number) => {
    setRegeneratingImageIndex(index)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const updatedTimeline = [...timeline]
    const sceneDescription = updatedTimeline[index].scene
    updatedTimeline[index] = {
      ...updatedTimeline[index],
      gigiImage: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(sceneDescription)}-regenerated-${Date.now()}`,
    }
    setTimeline(updatedTimeline)
    setRegeneratingImageIndex(null)
  }

  const handlePlayAudio = async (index: number) => {
    setPlayingAudioIndex(index)
    console.log("[v0] Playing audio for timeline", index, "with settings:", {
      language,
      emotion,
      speed: speed[0],
      pitch: pitch[0],
      text: timeline[index].dialogue,
    })
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setPlayingAudioIndex(null)
  }

  const canGenerateTimeline = scenario !== null

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">시나리오 & 음성 생성</h1>
        <p className="text-muted-foreground text-lg">영상 시나리오, 타임라인, 음성 설정을 한 번에 완성하세요</p>
      </div>

      <div className="space-y-6">
        <Card className="p-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">프롬프트 입력 (선택사항)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              원하는 시나리오 방향이 있다면 입력하세요. 비워두면 자동으로 생성됩니다.
            </p>
            <Textarea
              placeholder="예: 신제품의 혁신적인 기술력을 강조하며 젊은 층에게 어필하는 내용으로..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="pt-4 border-t">
            <h2 className="text-xl font-semibold mb-2">제품 사진 (선택)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              영상에 포함할 제품 사진이 있다면 업로드하세요. 지지 이미지는 자동으로 포함됩니다.
            </p>
            <input ref={productInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            {productImage ? (
              <div className="relative w-48 aspect-square rounded-lg overflow-hidden border-2 border-primary">
                <img src={productImage || "/placeholder.svg"} alt="Product" className="w-full h-full object-cover" />
                <Button
                  onClick={() => setProductImage(null)}
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => productInputRef.current?.click()}
                variant="outline"
                className="w-full h-32 border-dashed"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6" />
                  <span>제품 사진 업로드</span>
                  <span className="text-xs text-muted-foreground">선택사항</span>
                </div>
              </Button>
            )}
          </div>
        </Card>

        {/* Scenario Generation */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">영상 시나리오</h2>
              <p className="text-sm text-muted-foreground">
                브랜드 톤앤매너와 지지의 스타일을 반영한 시나리오를 생성합니다
              </p>
            </div>
            <div className="flex gap-2">
              {scenario && (
                <Button onClick={handleRegenerateScenario} disabled={isGeneratingScenario} variant="outline" size="lg">
                  {isGeneratingScenario ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      재생성 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      시나리오 재생성
                    </>
                  )}
                </Button>
              )}
              {!scenario && (
                <Button onClick={handleGenerateScenario} disabled={isGeneratingScenario} size="lg">
                  {isGeneratingScenario ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      시나리오 생성
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {scenario ? (
            <div className="bg-muted/30 rounded-lg p-6">
              <p className="text-base leading-relaxed whitespace-pre-line">{scenario}</p>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">시나리오 생성 버튼을 클릭하세요</p>
            </div>
          )}
        </Card>

        {/* Timeline/Storyboard Generation */}
        {scenario && (
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">타임라인 / 스토리보드</h2>
                <p className="text-sm text-muted-foreground">30초 영상을 위한 상세 타임라인을 생성합니다 (5초 간격)</p>
              </div>
              {timeline.length === 0 && (
                <Button onClick={handleGenerateTimeline} disabled={isGeneratingTimeline} size="lg">
                  {isGeneratingTimeline ? (
                    <>
                      <Clock className="mr-2 h-5 w-5 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-5 w-5" />
                      타임라인 생성하기
                    </>
                  )}
                </Button>
              )}
            </div>

            {timeline.length > 0 ? (
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={index} className="bg-muted/30 rounded-lg p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="relative">
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted border-2 border-border">
                          {item.gigiImage ? (
                            <img
                              src={item.gigiImage || "/placeholder.svg"}
                              alt={`Scene ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={() => handleRegenerateTimelineImage(index)}
                            disabled={regeneratingImageIndex === index}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                          >
                            {regeneratingImageIndex === index ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                재생성 중...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                이미지 재생성
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handlePlayAudio(index)}
                            disabled={playingAudioIndex === index}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                          >
                            {playingAudioIndex === index ? (
                              <>
                                <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
                                재생 중...
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                음성 듣기
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-primary">{item.timestamp}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">장면</div>
                          <div className="font-medium">{item.scene}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">대사</div>
                          <div className="text-foreground">&ldquo;{item.dialogue}&rdquo;</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">타임라인 생성하기 버튼을 클릭하세요</p>
              </div>
            )}
          </Card>
        )}

        {timeline.length > 0 && (
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">음성 설정</h2>
            <div className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-3">
                <Label htmlFor="language" className="text-base font-semibold">
                  언어
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">영어</SelectItem>
                    <SelectItem value="ja">일본어</SelectItem>
                    <SelectItem value="zh">중국어</SelectItem>
                    <SelectItem value="fr">프랑스어</SelectItem>
                    <SelectItem value="de">독일어</SelectItem>
                    <SelectItem value="es">스페인어</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Emotion Selection */}
              <div className="space-y-3">
                <Label htmlFor="emotion" className="text-base font-semibold">
                  감정
                </Label>
                <Select value={emotion} onValueChange={setEmotion}>
                  <SelectTrigger id="emotion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">차분함 (Neutral)</SelectItem>
                    <SelectItem value="cheerful">밝고 활기찬 (Cheerful)</SelectItem>
                    <SelectItem value="warm">따뜻한 (Warm)</SelectItem>
                    <SelectItem value="professional">전문적인 (Professional)</SelectItem>
                    <SelectItem value="friendly">친근한 (Friendly)</SelectItem>
                    <SelectItem value="excited">열정적인 (Excited)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Speaking Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="speed" className="text-base font-semibold">
                    말하기 속도
                  </Label>
                  <span className="text-sm font-medium text-primary">{speed[0].toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-12">느리게</span>
                  <Slider
                    id="speed"
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">빠르게</span>
                </div>
              </div>

              {/* Pitch */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pitch" className="text-base font-semibold">
                    음높이
                  </Label>
                  <span className="text-sm font-medium text-primary">{pitch[0].toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-12">낮음</span>
                  <Slider
                    id="pitch"
                    value={pitch}
                    onValueChange={setPitch}
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">높음</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-semibold">음성 복제 (선택)</Label>
                <p className="text-sm text-muted-foreground">
                  참고할 음성 파일을 업로드하면 해당 음성을 기반으로 생성됩니다.
                </p>
                <input
                  ref={voiceCloneInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleVoiceCloneUpload}
                  className="hidden"
                />
                {cloneVoiceFile ? (
                  <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <span className="text-sm flex-1">음성 파일이 업로드되었습니다</span>
                    <Button onClick={() => setCloneVoiceFile(null)} size="sm" variant="ghost">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => voiceCloneInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-20 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-5 w-5" />
                      <span>음성 파일 업로드</span>
                      <span className="text-xs text-muted-foreground">선택사항</span>
                    </div>
                  </Button>
                )}
              </div>

              {/* Voice Settings Summary */}
              <div className="pt-4">
                <Card className="p-4 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Volume2 className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-medium">음성 설정 요약</div>
                      <div className="text-sm text-muted-foreground">
                        언어:{" "}
                        {language === "ko"
                          ? "한국어"
                          : language === "en"
                            ? "영어"
                            : language === "ja"
                              ? "일본어"
                              : language === "zh"
                                ? "중국어"
                                : language === "fr"
                                  ? "프랑스어"
                                  : language === "de"
                                    ? "독일어"
                                    : "스페인어"}{" "}
                        | 감정:{" "}
                        {emotion === "neutral"
                          ? "차분함"
                          : emotion === "cheerful"
                            ? "밝고 활기찬"
                            : emotion === "warm"
                              ? "따뜻한"
                              : emotion === "professional"
                                ? "전문적인"
                                : emotion === "friendly"
                                  ? "친근한"
                                  : "열정적인"}{" "}
                        | 속도: {speed[0].toFixed(1)}x | 음높이: {pitch[0].toFixed(1)}
                        {cloneVoiceFile && " | 음성 복제 활성화"}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <Button onClick={onBack} variant="outline" size="lg" className="flex-1 bg-transparent">
            <ChevronLeft className="mr-2 h-5 w-5" />
            이전 단계
          </Button>

          {timeline.length > 0 && (
            <Button
              onClick={() => {
                const voiceText = timeline.map((t) => t.dialogue).join("\n")
                onNext({
                  scenario: scenario!,
                  timeline,
                  productImage: productImage || undefined,
                  voiceSettings: {
                    text: voiceText,
                    language,
                    emotion,
                    speed: speed[0],
                    pitch: pitch[0],
                    cloneVoiceFile: cloneVoiceFile || undefined,
                  },
                })
              }}
              size="lg"
              className="flex-1"
            >
              비디오 생성하기
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          )}

          {/* Skip Button for Step 2 */}
          {timeline.length === 0 && (
            <Button
              onClick={() => {
                const defaultTimeline: TimelineItem[] = [
                  {
                    timestamp: "0:00 - 0:30",
                    scene: "기본 시나리오",
                    dialogue: "안녕하세요, 지지입니다.",
                    gigiImage: styleData?.generatedImage,
                  },
                ]
                onNext({
                  scenario: scenario || "기본 시나리오가 생성되었습니다.",
                  timeline: defaultTimeline,
                  productImage: productImage || undefined,
                  voiceSettings: {
                    text: "안녕하세요, 지지입니다.",
                    language,
                    emotion,
                    speed: speed[0],
                    pitch: pitch[0],
                    cloneVoiceFile: cloneVoiceFile || undefined,
                  },
                })
              }}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              건너뛰기 (기본 시나리오 사용)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
